import { Logger } from '@nestjs/common';

export interface KeyValidationResult {
  keyMasked: string;
  pool: 'chat' | 'sync';
  index: number;
  valid: boolean;
  exhausted: boolean;
  modelAccessible: boolean;
  resetsAt: string | null;
  resetsInMs: number | null;
  resetsInHrs: string | null;
  error?: string;
}

const exhaustionTimestamps = new Map<string, number>();

function maskKey(key: string): string {
  if (key.length <= 8) return key.slice(0, 4) + '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

function getNextMidnightPacific(): number {
  const now = new Date();
  const laStr = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false });
  const [datePart, timePart] = laStr.split(', ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  const laAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const laOffsetMs = now.getTime() - laAsUtc;
  const laMidnightAsUtc = Date.UTC(year, month - 1, day + 1, 0, 0, 0);
  return laMidnightAsUtc + laOffsetMs;
}

function computeResetsAt(): { resetsAt: string; resetsInMs: number; resetsInHrs: string } {
  const resetTime = getNextMidnightPacific();
  const ms = Math.max(0, resetTime - Date.now());
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return {
    resetsAt: new Date(resetTime).toISOString(),
    resetsInMs: ms,
    resetsInHrs: `${hrs}h ${mins}m`,
  };
}

export async function validateGeminiKey(
  key: string,
  model = 'gemini-2.0-flash-lite',
): Promise<{
  valid: boolean;
  exhausted: boolean;
  modelAccessible: boolean;
  error?: string;
  resetsAt: string | null;
  resetsInMs: number | null;
  resetsInHrs: string | null;
}> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });

    if (response.ok) {
      return { valid: true, exhausted: false, modelAccessible: true, resetsAt: null, resetsInMs: null, resetsInHrs: null };
    }

    const body = await response.text();

    if (response.status === 429) {
      const isQuota = /quota|RATE_LIMIT|dailyLimit|RESOURCE_EXHAUSTED/i.test(body);
      exhaustionTimestamps.set(key, Date.now());
      const reset = computeResetsAt();
      return {
        valid: true,
        exhausted: isQuota,
        modelAccessible: true,
        ...reset,
        error: `429 — ${isQuota ? 'Quota exhausted' : 'Rate limited'}: ${body.slice(0, 150)}`,
      };
    }

    if (response.status === 403 || response.status === 401) {
      return {
        valid: false,
        exhausted: false,
        modelAccessible: false,
        resetsAt: null, resetsInMs: null, resetsInHrs: null,
        error: `${response.status} — API key not authorized: ${body.slice(0, 150)}`,
      };
    }

    if (response.status === 404) {
      return {
        valid: true,
        exhausted: false,
        modelAccessible: false,
        resetsAt: null, resetsInMs: null, resetsInHrs: null,
        error: `404 — Model '${model}' not found for this key`,
      };
    }

    return {
      valid: false,
      exhausted: false,
      modelAccessible: false,
      resetsAt: null, resetsInMs: null, resetsInHrs: null,
      error: `${response.status}: ${body.slice(0, 150)}`,
    };
  } catch (err: any) {
    return {
      valid: false,
      exhausted: false,
      modelAccessible: false,
      resetsAt: null, resetsInMs: null, resetsInHrs: null,
      error: `Network error: ${err?.message || err}`,
    };
  }
}

export async function validateGeminiKeyQuick(
  key: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      { method: 'GET' },
    );

    if (response.ok) return { valid: true };

    const body = await response.text();
    return {
      valid: false,
      error: `${response.status}: ${body.slice(0, 150)}`,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Network error: ${err?.message || err}`,
    };
  }
}

export function loadChatApiKeys(): string[] {
  const raw = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
  return raw.split(',').map((k) => k.trim()).filter(Boolean);
}

export function loadSyncApiKeys(): string[] {
  const raw = process.env.GOOGLE_GENERATIVE_AI_SYNC_API_KEYS || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
  return raw.split(',').map((k) => k.trim()).filter(Boolean);
}

export async function getAllKeyStatuses(): Promise<KeyValidationResult[]> {
  const results: KeyValidationResult[] = [];

  const chatKeys = loadChatApiKeys();
  for (let i = 0; i < chatKeys.length; i++) {
    const status = await validateGeminiKey(chatKeys[i]);
    results.push({
      keyMasked: maskKey(chatKeys[i]),
      pool: 'chat',
      index: i + 1,
      ...status,
    });
  }

  const syncKeys = loadSyncApiKeys();
  for (let i = 0; i < syncKeys.length; i++) {
    const status = await validateGeminiKey(syncKeys[i]);
    results.push({
      keyMasked: maskKey(syncKeys[i]),
      pool: 'sync',
      index: i + 1,
      ...status,
    });
  }

  return results;
}

export async function logKeyHealth(logger: Logger, pool?: 'chat' | 'sync'): Promise<void> {
  let statuses: KeyValidationResult[] = [];

  if (pool === 'chat' || !pool) {
    const chatKeys = loadChatApiKeys();
    for (let i = 0; i < chatKeys.length; i++) {
      const quick = await validateGeminiKeyQuick(chatKeys[i]);
      statuses.push({
        keyMasked: maskKey(chatKeys[i]),
        pool: 'chat',
        index: i + 1,
        valid: quick.valid,
        exhausted: false,
        modelAccessible: false,
        resetsAt: null, resetsInMs: null, resetsInHrs: null,
        error: quick.error,
      });
    }
  }

  if (pool === 'sync' || !pool) {
    const syncKeys = loadSyncApiKeys();
    for (let i = 0; i < syncKeys.length; i++) {
      const quick = await validateGeminiKeyQuick(syncKeys[i]);
      statuses.push({
        keyMasked: maskKey(syncKeys[i]),
        pool: 'sync',
        index: i + 1,
        valid: quick.valid,
        exhausted: false,
        modelAccessible: false,
        resetsAt: null, resetsInMs: null, resetsInHrs: null,
        error: quick.error,
      });
    }
  }

  for (const s of statuses) {
    if (!s.valid) {
      logger.warn(`[KeyHealth] ${s.pool} key #${s.index} (${s.keyMasked}) INVALID — ${s.error}`);
    } else {
      logger.log(`[KeyHealth] ${s.pool} key #${s.index} (${s.keyMasked}) OK`);
    }
  }
}
