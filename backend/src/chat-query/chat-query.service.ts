import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import { logKeyHealth } from '../common/gemini-key-validator';

@Injectable()
export class ChatQueryService {
  private readonly logger = new Logger(ChatQueryService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {
    logKeyHealth(this.logger, 'chat').catch(() => {});
  }

  async query(userId: string, message: string): Promise<{ answer: string }> {
    if (!userId) throw new ForbiddenException('User ID required');

    const user = await this.userModel.findById(userId as any).exec();
    if (!user) throw new ForbiddenException('User not found');

    const isWriteRequest = /(change|update|modify|edit|create|delete|remove|add|set|schedule|plan)\s/i.test(message);

    if (isWriteRequest) {
      return {
        answer:
          "I can only read your data here. To make changes to your plan or data, please use the CycloAI web dashboard at http://localhost:3000/dashboard.",
      };
    }

    const contextParts: string[] = [];
    contextParts.push(`Athlete: ${user.firstName} ${user.lastName}`);
    if (user.goal) contextParts.push(`Goal: ${user.goal}`);
    if (user.ftp) contextParts.push(`FTP: ${user.ftp} W`);
    if (user.weightKg) contextParts.push(`Weight: ${user.weightKg} kg`);
    if (user.heightCm) contextParts.push(`Height: ${user.heightCm} cm`);
    if (user.maxHeartrate) contextParts.push(`Max HR: ${user.maxHeartrate} bpm`);
    if (user.age) contextParts.push(`Age: ${user.age}`);
    if (user.cyclingYears) contextParts.push(`Cycling experience: ${user.cyclingYears} years`);
    if (user.onboardingSummary) contextParts.push(`Background: ${user.onboardingSummary}`);
    contextParts.push(`Total distance: ${((user.totalDistance || 0) / 1000).toFixed(0)} km`);
    contextParts.push(`Total moving time: ${Math.round((user.totalMovingTime || 0) / 3600)} hours`);

    const systemPrompt =
      "You are a read-only cycling coach assistant. Answer the athlete's question using ONLY the provided context. " +
      "If the information is not in the context, say so. Keep answers concise and helpful. " +
      "Do NOT suggest changes to their plan or data — they must use the web dashboard for that.\n\n" +
      contextParts.join('\n');

    const rawKeys = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    const apiKeys = rawKeys.split(',').map((k) => k.trim()).filter(Boolean);
    
    if (apiKeys.length === 0) return { answer: 'AI service is not configured.' };

    const fullPrompt = systemPrompt + '\n\nUser question: ' + message;

    // Try Gemini first
    const maxAttempts = apiKeys.length * 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = apiKeys[attempt % apiKeys.length];
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: fullPrompt }] },
              ],
              generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
            }),
          },
        );

        if (response.status === 429) {
          this.logger.warn(`Chat query rate limited — quota likely exhausted for key`);
          if (attempt === maxAttempts - 1) {
            return { answer: 'Sorry, the AI service is currently at its quota limit. Please try again later.' };
          }
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          this.logger.error(`Gemini error: ${response.status} ${errText}`);
          if (attempt === maxAttempts - 1) {
            return { answer: 'Sorry, the AI service is currently unavailable.' };
          }
          continue;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return { answer: text || 'No response could be generated.' };
      } catch (err) {
        this.logger.error(`Chat query failed (attempt ${attempt + 1}): ${err}`);
        if (attempt === maxAttempts - 1) {
          const groqAnswer = await this.callGroqFallback(fullPrompt);
          if (groqAnswer) return { answer: groqAnswer };
          return { answer: 'Sorry, something went wrong.' };
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Fallback to Groq if Gemini failed
    const groqAnswer = await this.callGroqFallback(fullPrompt);
    if (groqAnswer) return { answer: groqAnswer };

    return { answer: 'Sorry, the AI service is currently unavailable.' };
  }

  private async callGroqFallback(prompt: string): Promise<string | null> {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return null;

    const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: groqModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 512,
          }),
        });

        if (response.status === 429 || response.status === 413) {
          const wait = 60_000;
          this.logger.warn(`Groq fallback rate limited (${response.status}), waiting 60s (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          this.logger.error(`Groq fallback error: ${response.status} ${errText.slice(0, 200)}`);
          return null;
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || null;
      } catch (err) {
        if (attempt === maxRetries - 1) {
          this.logger.error(`Groq fallback failed: ${err}`);
          return null;
        }
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }

    return null;
  }
}
