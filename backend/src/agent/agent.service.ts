import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { AgentMemoryService } from './agent-memory.service';
import { AgentChatStoreService } from './agent-chat-store.service';
import { AgentMemory } from './agent-memory.schema';
import { User } from '../user/user.schema';
import { Activity } from '../activity/activity.schema';
import { TrainingContextService } from '../training-context/training-context.service';
import { EmbeddingService } from '../analysis/embedding.service';
import { PineconeClient } from '../analysis/pinecone-client';
import { createAgentTools, ToolDefinition, ToolDeps } from './agent-tools';
import { buildAgentSystemPrompt } from './agent-system-prompt';
import { logKeyHealth } from '../common/gemini-key-validator';

const MAX_STEPS = 10;
const MAX_HISTORY_MESSAGES = 30;

interface GeminiMessage {
  role: 'user' | 'model' | 'function';
  parts: GeminiPart[];
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, any> };
  functionResponse?: { name: string; response: Record<string, any> };
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private tools: ToolDefinition[];
  private apiKeys: string[] = [];
  private model = 'gemini-2.0-flash';
  private configured = false;

  constructor(
    private readonly memoryService: AgentMemoryService,
    private readonly chatStore: AgentChatStoreService,
    private readonly trainingContext: TrainingContextService,
    private readonly embedder: EmbeddingService,
    private readonly pinecone: PineconeClient,
    @InjectModel(AgentMemory.name) private memoryModel: Model<AgentMemory>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {
    this.tools = createAgentTools();
    this.loadApiKeys();
    logKeyHealth(this.logger, 'chat').catch(() => {});
  }

  private loadApiKeys(): void {
    let keys: string[] = [];
    let model = 'gemini-2.0-flash-lite';

    const rawKeys = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    if (rawKeys) {
      keys = rawKeys.split(',').map((k) => k.trim()).filter(Boolean);
    }

    if (keys.length === 0) {
      const configPaths = [
        join(homedir(), '.cycling-coach', 'config.yaml'),
        join(homedir(), '.config', 'cycling-coach', 'config.yaml'),
        join(homedir(), '.enduragent', 'cycling-coach', 'config.yaml'),
      ];
      for (const p of configPaths) {
        if (existsSync(p)) {
          try {
            const raw = readFileSync(p, 'utf-8');
            const c = parseYaml(raw) as any;
            if (c?.llm?.api_key) {
              keys = String(c.llm.api_key).split(',').map((k: string) => k.trim()).filter(Boolean);
              if (c.llm.model) model = c.llm.model;
              break;
            }
          } catch {}
        }
      }
    }

    this.apiKeys = keys;
    this.model = model;
    this.configured = keys.length > 0;
  }

  private buildToolDeps(userId: string): ToolDeps {
    const memDeps = {
      getContext: () => this.memoryService.getContext(userId),
      writeSection: (section: string, content: string) => this.memoryService.writeSection(userId, section, content),
      appendDailyNote: (note: string, date?: string) => this.memoryService.appendDailyNote(userId, note, date),
      savePlan: (plan: Record<string, any>) => this.memoryService.savePlan(userId, plan),
      loadPlan: () => this.memoryService.loadPlan(userId),
    };

    return {
      userId,
      memory: memDeps,
      trainingContext: {
        getCurrentWeekPlan: () => this.trainingContext.getCurrentWeekPlan(userId),
        getWeeklyPlan: (rw: number) => this.trainingContext.getWeeklyPlan(userId, rw),
        upsertWeeklyPlan: (rw: number, data: any) => this.trainingContext.upsertWeeklyPlan(userId, rw, data),
        getPreRacePlans: (raceId: string) => this.trainingContext.getPreRacePlans(raceId, userId),
      },
      activity: {
        getRecentActivities: async (limit: number) => {
          return this.activityModel.find({ user: userId as any })
            .sort({ date: -1 })
            .limit(limit)
            .lean()
            .exec();
        },
      },
    };
  }

  async chat(userId: string, message: string, chatId?: string): Promise<{ text: string }> {
    if (!this.configured) {
      return { text: 'AI analysis is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment.' };
    }

    const cid = chatId || 'default';
    const tz = 'UTC';
    const { messages: history } = await this.chatStore.load(userId, cid);

    const memoryContext = await this.memoryService.getContext(userId);

    const retrievedContext = await this.retrieveContext(message);

    const systemPrompt = buildAgentSystemPrompt(memoryContext, tz, retrievedContext);

    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

    let geminiHistory: GeminiMessage[] = recentHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role as 'user' | 'model',
      parts: [{ text: m.content }],
    }));

    geminiHistory.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const toolDeclarations = this.tools.map((t) => t.declaration);

    let stepCount = 0;
    let finalText = '';

    while (stepCount < MAX_STEPS) {
      stepCount++;

      let result = await this.callGemini(systemPrompt, geminiHistory, toolDeclarations);

      if (!result) {
        result = await this.callGroq(systemPrompt, geminiHistory, toolDeclarations);
      }

      if (!result) {
        finalText = 'Sorry, the AI service is currently unavailable.';
        break;
      }

      const candidate = result.candidates?.[0];
      if (!candidate?.content?.parts) {
        finalText = 'No response could be generated.';
        break;
      }

      const parts = candidate.content.parts;
      const responseParts: GeminiPart[] = [];
      let hasFunctionCall = false;

      for (const part of parts) {
        if (part.functionCall) {
          hasFunctionCall = true;
          const fc = part.functionCall;
          const tool = this.tools.find((t) => t.declaration.name === fc.name);

          let resultData: any;
          if (tool) {
            try {
              const deps = this.buildToolDeps(userId);
              resultData = await tool.execute(fc.args || {}, deps);
            } catch (err) {
              this.logger.error(`Tool ${fc.name} failed: ${err}`);
              resultData = { error: `Tool execution failed: ${(err as Error).message}` };
            }
          } else {
            resultData = { error: `Unknown tool: ${fc.name}` };
          }

          responseParts.push({
            functionResponse: {
              name: fc.name,
              response: { result: resultData },
            },
          });
        } else if (part.text) {
          finalText = part.text;
        }
      }

      geminiHistory.push({
        role: 'model',
        parts: parts.map((p: GeminiPart) => {
          if (p.functionCall) {
            return { functionCall: { name: p.functionCall.name, args: p.functionCall.args } };
          }
          return { text: p.text || '' };
        }),
      });

      if (hasFunctionCall) {
        geminiHistory.push({
          role: 'function',
          parts: responseParts,
        });
      }

      if (!hasFunctionCall) {
        break;
      }
    }

    if (stepCount >= MAX_STEPS && !finalText) {
      finalText = 'I apologize, but I was unable to complete my analysis. Please try asking a more specific question.';
    }

    await this.chatStore.appendMessage(userId, cid, 'user', message);
    if (finalText) {
      await this.chatStore.appendMessage(userId, cid, 'assistant', finalText);
    }

    return { text: finalText || 'No response generated.' };
  }

  private async retrieveContext(query: string): Promise<string> {
    if (!this.embedder.isConfigured || !this.pinecone.isConfigured) return '';

    try {
      const vector = await this.embedder.embedText(query);
      const { matches } = await this.pinecone.query(vector, 5);

      if (!matches || matches.length === 0) return '';

      const lines = matches.map((m: any) => {
        const meta = m.metadata as any;
        if (meta?.kind === 'profile') {
          return `[Athlete Profile] ${meta.summary}`;
        }
        return `[Activity] ${meta.summary}`;
      });

      return 'Here are some semantically relevant items from the athlete\'s history:\n' + lines.join('\n');
    } catch (err) {
      this.logger.warn(`RAG query failed: ${err}`);
      return '';
    }
  }

  private async callGemini(
    systemPrompt: string,
    history: GeminiMessage[],
    toolDeclarations: Record<string, any>[],
  ): Promise<any> {
    if (!this.configured || this.apiKeys.length === 0) return null;

    const currentModel = process.env.GOOGLE_LLM_MODEL || this.model;

    const body: any = {
      contents: history,
      systemInstruction: {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      tools: toolDeclarations.length > 0
        ? [{ functionDeclarations: toolDeclarations }]
        : undefined,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const maxAttempts = this.apiKeys.length * 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = this.apiKeys[attempt % this.apiKeys.length];
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        );

        if (response.status === 429) {
          const errBody = await response.text().catch(() => 'unknown');
          this.logger.warn(`Agent LLM 429 on key ${(attempt % this.apiKeys.length) + 1}: ${errBody.slice(0, 200)}`);
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          this.logger.error(`Gemini API error: ${response.status} ${errText}`);
          return null;
        }

        return await response.json();
      } catch (err) {
        this.logger.error(`Gemini call failed (attempt ${attempt + 1}): ${err}`);
        if (attempt === maxAttempts - 1) return null;
      }
    }

    this.logger.warn('All Gemini keys exhausted');
    return null;
  }

  private async callGroq(
    systemPrompt: string,
    history: GeminiMessage[],
    toolDeclarations: Record<string, any>[],
  ): Promise<any> {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return null;

    const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of history) {
      if (msg.role === 'user') {
        const text = msg.parts.map((p) => p.text || '').join('');
        if (text) messages.push({ role: 'user', content: text });
      } else if (msg.role === 'model') {
        const text = msg.parts.find((p) => p.text)?.text || '';
        const fc = msg.parts.find((p) => p.functionCall);
        if (fc) {
          messages.push({
            role: 'assistant',
            content: text || null,
            tool_calls: [{
              id: `call_${fc.functionCall!.name}`,
              type: 'function',
              function: {
                name: fc.functionCall!.name,
                arguments: JSON.stringify(fc.functionCall!.args),
              },
            }],
          });
        } else {
          messages.push({ role: 'assistant', content: text });
        }
      } else if (msg.role === 'function') {
        for (const part of msg.parts) {
          if (part.functionResponse) {
            messages.push({
              role: 'tool',
              tool_call_id: `call_${part.functionResponse.name}`,
              content: JSON.stringify(part.functionResponse.response),
            });
          }
        }
      }
    }

    const tools = toolDeclarations.length > 0
      ? toolDeclarations.map((d) => ({
          type: 'function' as const,
          function: {
            name: d.name,
            description: d.description,
            parameters: d.parameters,
          },
        }))
      : undefined;

    const body: any = {
      model: groqModel,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    };
    if (tools?.length) body.tools = tools;

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify(body),
        });

        if (response.status === 429 || response.status === 413) {
          const wait = 60_000;
          this.logger.warn(`Groq rate limited (${response.status}), waiting 60s (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          this.logger.error(`Groq API error: ${response.status} ${errText.slice(0, 200)}`);
          return null;
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        if (!choice?.message) return null;

        const parts: any[] = [];
        if (choice.message.content) {
          parts.push({ text: choice.message.content });
        }
        if (choice.message.tool_calls) {
          for (const tc of choice.message.tool_calls) {
            if (tc.type === 'function') {
              let args: Record<string, any> = {};
              try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
              parts.push({
                functionCall: { name: tc.function.name, args },
              });
            }
          }
        }

        return { candidates: [{ content: { parts } }] };
      } catch (err) {
        if (attempt === maxRetries - 1) {
          this.logger.error(`Groq call failed: ${err}`);
          return null;
        }
        this.logger.warn(`Groq call failed (attempt ${attempt + 1}), retrying: ${err}`);
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }

    return null;
  }
}
