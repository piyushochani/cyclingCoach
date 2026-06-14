import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';

function loadConfigYaml(): Record<string, any> | null {
  const configPaths = [
    join(homedir(), '.cycling-coach', 'config.yaml'),
    join(homedir(), '.config', 'cycling-coach', 'config.yaml'),
    join(homedir(), '.enduragent', 'cycling-coach', 'config.yaml'),
  ];
  for (const p of configPaths) {
    if (existsSync(p)) {
      try {
        return parseYaml(readFileSync(p, 'utf-8')) as Record<string, any>;
      } catch {}
    }
  }
  return null;
}

export interface GroqConfig {
  apiKeys: string[];
  model: string;
  fallbackModels: string[];
}

export function loadChatApiKeys(): string[] {
  const raw = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
  let keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    const c = loadConfigYaml();
    if (c?.llm?.api_key) {
      keys = String(c.llm.api_key).split(',').map((k: string) => k.trim()).filter(Boolean);
    }
  }
  return keys;
}

export function loadSyncApiKeys(): string[] {
  const raw = process.env.GOOGLE_GENERATIVE_AI_SYNC_API_KEYS || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
  let keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    const c = loadConfigYaml();
    if (c?.llm?.sync_api_key) {
      keys = String(c.llm.sync_api_key).split(',').map((k: string) => k.trim()).filter(Boolean);
    } else if (c?.llm?.api_key) {
      keys = String(c.llm.api_key).split(',').map((k: string) => k.trim()).filter(Boolean);
    }
  }
  return keys;
}

export function loadGroqConfig(): GroqConfig | null {
  let rawKeys = (process.env.GROQ_API_KEY || '').trim();
  let chatModel = (process.env.GROQ_CHAT_MODEL || process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim();
  let fallbackRaw = (process.env.GROQ_FALLBACK_MODELS || 'llama-3.3-70b-versatile').trim();

  if (!rawKeys) {
    const c = loadConfigYaml();
    if (c?.groq?.GROQ_API_KEY) rawKeys = String(c.groq.GROQ_API_KEY).trim();
    else if (c?.groq?.api_key) rawKeys = String(c.groq.api_key).trim();
    if (c?.groq?.GROQ_CHAT_MODEL) chatModel = String(c.groq.GROQ_CHAT_MODEL).trim();
    else if (c?.groq?.GROQ_MODEL) chatModel = String(c.groq.GROQ_MODEL).trim();
    if (c?.groq?.GROQ_FALLBACK_MODELS) fallbackRaw = String(c.groq.GROQ_FALLBACK_MODELS).trim();
  }

  const apiKeys = rawKeys.split(',').map((k) => k.trim()).filter(Boolean);
  if (apiKeys.length === 0) return null;

  const fallbackModels = fallbackRaw.split(',').map((m) => m.trim()).filter(Boolean);

  return { apiKeys, model: chatModel, fallbackModels };
}

export function getLlmProvider(): 'google' | 'groq' | 'auto' {
  const provider = (process.env.LLM_PROVIDER || 'auto').toLowerCase();
  if (provider === 'groq' || provider === 'google') return provider;
  return 'auto';
}

export function getGeminiModel(fallback = 'gemini-2.0-flash-lite'): string {
  const fromEnv = process.env.GOOGLE_LLM_MODEL;
  if (fromEnv) return fromEnv;
  const c = loadConfigYaml();
  if (c?.llm?.model) return String(c.llm.model);
  return fallback;
}

export function isGeminiQuotaError(status: number, body: string): boolean {
  return status === 429 && /quota|dailyLimit|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(body);
}
