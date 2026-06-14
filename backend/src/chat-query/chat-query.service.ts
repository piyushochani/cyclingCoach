import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import { logKeyHealth } from '../common/gemini-key-validator';
import { callGroqSimple } from '../common/groq-client';
import { getGeminiModel, isGeminiQuotaError, loadChatApiKeys } from '../common/llm-config';

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
          "I can only read your data here. To make changes to your plan or data, please use the CyclogenAI web dashboard at http://localhost:3000/dashboard.",
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

    const fullPrompt = systemPrompt + '\n\nUser question: ' + message;
    const apiKeys = loadChatApiKeys();
    
    if (apiKeys.length === 0) {
      const groqAnswer = await callGroqSimple(this.logger, fullPrompt, { temperature: 0.3, maxTokens: 512 });
      if (groqAnswer) return { answer: groqAnswer };
      return { answer: 'AI service is not configured.' };
    }

    const model = getGeminiModel();

    // Try Gemini first
    const maxAttempts = apiKeys.length * 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = apiKeys[attempt % apiKeys.length];
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
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
          const errBody = await response.text().catch(() => '');
          this.logger.warn(`Chat query rate limited — quota likely exhausted for key`);
          if (isGeminiQuotaError(response.status, errBody)) {
            this.logger.warn('Gemini quota exhausted — falling back to Groq');
            break;
          }
          if (attempt === maxAttempts - 1) break;
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
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    const groqAnswer = await callGroqSimple(this.logger, fullPrompt, { temperature: 0.3, maxTokens: 512 });
    if (groqAnswer) return { answer: groqAnswer };

    return { answer: 'Sorry, the AI service is currently unavailable.' };
  }
}
