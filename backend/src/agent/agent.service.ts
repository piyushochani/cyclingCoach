import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentMemoryService } from './agent-memory.service';
import { AgentChatStoreService } from './agent-chat-store.service';
import { FaqService } from './faq.service';
import { AgentMemory } from './agent-memory.schema';
import { User } from '../user/user.schema';
import { Activity } from '../activity/activity.schema';
import { Bike, Equipment } from '../gear/gear.schema';
import { TrainingContextService } from '../training-context/training-context.service';
import { EmbeddingService } from '../analysis/embedding.service';
import { PineconeClient } from '../analysis/pinecone-client';
import {
  buildActivitySummary,
  buildAthleteProfile,
  buildMonthSummary,
  contextBlocksForIntent,
  mergeAthleteContext,
} from './agent-athlete-context';
import {
  buildGreetingReply,
  classifyIntent,
  shouldLoadAgentMemory,
  shouldSearchFaq,
  shouldUseRag,
  toolNamesForIntent,
} from './agent-intent';
import { createAgentTools, ToolDefinition, ToolDeps } from './agent-tools';
import { buildAgentSystemPrompt, buildCompactAgentSystemPrompt } from './agent-system-prompt';
import { logKeyHealth } from '../common/gemini-key-validator';
import { groqChatCompletion } from '../common/groq-client';
import {
  getGeminiModel,
  getLlmProvider,
  isGeminiQuotaError,
  loadChatApiKeys,
  loadGroqConfig,
} from '../common/llm-config';

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
    private readonly faqService: FaqService,
    @InjectModel(AgentMemory.name) private memoryModel: Model<AgentMemory>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Bike.name) private bikeModel: Model<Bike>,
    @InjectModel(Equipment.name) private equipmentModel: Model<Equipment>,
  ) {
    this.tools = createAgentTools();
    this.loadApiKeys();
    logKeyHealth(this.logger, 'chat').catch(() => {});
  }

  private loadApiKeys(): void {
    this.apiKeys = loadChatApiKeys();
    this.model = getGeminiModel('gemini-2.0-flash-lite');
    this.configured = this.apiKeys.length > 0 || loadGroqConfig() !== null;
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
          return this.activityModel.find({ 
            user: userId as any,
            sport: { $regex: /ride|cycling|bike|bicycle|velomobile|handcycle/i }
          })
            .sort({ date: -1 })
            .limit(limit)
            .lean()
            .exec();
        },
      },
      strava: {
        getAuthUrl: async () => {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            return `${baseUrl}/strava/auth-url`;
          } catch {
            return 'http://localhost:3001/strava/auth-url';
          }
        },
        getSyncStatus: async () => {
          const user = await this.userModel.findById(userId as any).lean().exec();
          if (!user) return { connected: false };
          return {
            connected: !!(user as any).stravaAccessToken,
            lastSyncAt: (user as any).lastSyncAt || null,
            stravaConnectedAt: (user as any).stravaConnectedAt || null,
            totalActivities: (user as any).totalActivities || 0,
            totalDistance: (user as any).totalDistance || 0,
          };
        },
        triggerSync: async () => {
          return 'Sync triggered. New activities will appear shortly. You can also run a full sync from Settings > Strava.';
        },
      },
      gear: {
        listBikes: async () => {
          return this.bikeModel.find({ user: userId as any }).lean().exec();
        },
        addBike: async (name: string, isActive?: boolean) => {
          if (isActive) {
            await this.bikeModel.updateMany({ user: userId as any }, { isActive: false }).exec();
          }
          const bike = new this.bikeModel({ name, user: userId as any, isActive: isActive || false, dateAdded: new Date() });
          return bike.save();
        },
        setActiveBike: async (id: string) => {
          await this.bikeModel.updateMany({ user: userId as any }, { isActive: false }).exec();
          await this.bikeModel.findByIdAndUpdate(id, { isActive: true }).exec();
        },
        listEquipment: async () => {
          return this.equipmentModel.find({ user: userId as any }).lean().exec();
        },
        addEquipment: async (name: string, type?: string, notes?: string) => {
          const eq = new this.equipmentModel({ name, type: type || 'other', notes: notes || '', user: userId as any, dateAdded: new Date() });
          return eq.save();
        },
      },
      faqSearch: (query: string, k?: number) => this.faqService.search(query, k || 5),
    };
  }

  async chat(userId: string, message: string, chatId?: string): Promise<{ text: string }> {
    if (!this.configured) {
      return { text: 'AI analysis is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY or GROQ_API_KEY in your environment.' };
    }

    this.apiKeys = loadChatApiKeys();
    const provider = getLlmProvider();
    const cid = chatId || 'default';
    const tz = 'UTC';
    const intent = classifyIntent(message);

    if (intent === 'greeting') {
      const { firstName } = await buildAthleteProfile(this.userModel, userId);
      const text = buildGreetingReply(firstName);
      await this.chatStore.appendMessage(userId, cid, 'user', message);
      await this.chatStore.appendMessage(userId, cid, 'assistant', text);
      return { text };
    }

    const { messages: history } = await this.chatStore.load(userId, cid);

    const { profile } = await buildAthleteProfile(this.userModel, userId);
    const { loadActivities, loadPlan } = contextBlocksForIntent(intent);
    const extraBlocks: string[] = [];

    if (loadActivities) {
      const summary = await buildActivitySummary(this.activityModel, userId, 5);
      if (summary) extraBlocks.push(summary);
    }

    if (loadPlan) {
      try {
        const plan = await this.trainingContext.getCurrentWeekPlan(userId);
        if (plan) {
          extraBlocks.push(`Current weekly plan:\n${JSON.stringify(plan, null, 2)}`);
        }
      } catch (err) {
        this.logger.warn(`Failed to load weekly plan: ${err}`);
      }
    }

    if (intent === 'month') {
      try {
        const monthSummary = await buildMonthSummary(this.activityModel, userId);
        extraBlocks.push(monthSummary);
      } catch (err) {
        this.logger.warn(`Month summary failed: ${err}`);
      }
    }

    let agentMemory = '';
    if (shouldLoadAgentMemory(intent)) {
      agentMemory = await this.memoryService.getContext(userId);
    }

    let retrievedContext = '';
    if (shouldUseRag(intent)) {
      retrievedContext = await this.retrieveContext(message);
    }

    let faqContext = '';
    if (shouldSearchFaq(intent)) {
      try {
        const faqResults = await this.faqService.search(message, 3);
        if (faqResults.length > 0) {
          faqContext = '# FAQ Knowledge\n\nThe following are relevant answers from the app FAQ. Use them to answer the athlete\'s question about how the app works:\n\n' +
            faqResults.map((r) => `Q: ${r.chunk.question}\nA: ${r.chunk.content}\n`).join('\n');
        }
      } catch (err) {
        this.logger.warn(`FAQ search failed: ${err}`);
      }
    }

    const athleteContext = mergeAthleteContext(profile, agentMemory, extraBlocks);
    const systemPrompt = buildAgentSystemPrompt(athleteContext, tz, retrievedContext, intent, faqContext);
    const groqSystemPrompt = buildCompactAgentSystemPrompt(athleteContext, tz, retrievedContext, intent, faqContext);

    const allowedToolNames = toolNamesForIntent(intent);
    const toolDeclarations = allowedToolNames.length === 0
      ? []
      : this.tools
          .filter((t) => allowedToolNames.includes(t.declaration.name))
          .map((t) => t.declaration);

    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

    let geminiHistory: GeminiMessage[] = recentHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role as 'user' | 'model',
      parts: [{ text: m.content }],
    }));

    geminiHistory.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let stepCount = 0;
    let finalText = '';

    while (stepCount < MAX_STEPS) {
      stepCount++;

      let result: any = null;
      if (provider === 'groq') {
        result = await this.callGroq(groqSystemPrompt, geminiHistory, toolDeclarations);
        if (!result) {
          result = await this.callGemini(systemPrompt, geminiHistory, toolDeclarations);
        }
      } else {
        result = await this.callGemini(systemPrompt, geminiHistory, toolDeclarations);
        if (!result) {
          this.logger.warn('Gemini unavailable — falling back to Groq');
          result = await this.callGroq(groqSystemPrompt, geminiHistory, toolDeclarations);
        }
      }

      if (!result) {
        finalText = 'Sorry, the AI service is currently unavailable. Gemini quota may be exhausted — Groq fallback also failed.';
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
    if (this.apiKeys.length === 0) return null;

    const currentModel = getGeminiModel(this.model);

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
          const errBody = await response.text().catch(() => '');
          this.logger.warn(`Agent LLM 429 on key ${(attempt % this.apiKeys.length) + 1}: ${errBody.slice(0, 200)}`);
          if (isGeminiQuotaError(response.status, errBody)) {
            this.logger.warn('Gemini daily quota exhausted — skipping remaining keys');
            return null;
          }
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          this.logger.error(`Gemini API error: ${response.status} ${errText.slice(0, 200)}`);
          if (attempt < maxAttempts - 1) continue;
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
    if (!loadGroqConfig()) return null;

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
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    };
    if (tools?.length) body.tools = tools;

    const data = await groqChatCompletion(this.logger, body);
    if (!data) return null;

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
  }
}
