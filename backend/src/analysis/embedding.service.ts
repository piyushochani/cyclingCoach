import { Injectable, Logger } from '@nestjs/common';
import { logKeyHealth } from '../common/gemini-key-validator';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKeys: string[];
  private keyIndex = 0;

  constructor() {
    const raw = process.env.GOOGLE_GENERATIVE_AI_SYNC_API_KEYS || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    this.apiKeys = raw.split(',').map((k) => k.trim()).filter(Boolean);
    logKeyHealth(this.logger, 'sync').catch(() => {});
  }

  get isConfigured(): boolean {
    return this.apiKeys.length > 0;
  }

  private get currentKey(): string {
    return this.apiKeys[this.keyIndex % this.apiKeys.length];
  }

  private rotateKey(): void {
    this.keyIndex = (this.keyIndex + 1) % this.apiKeys.length;
    this.logger.warn(`Rotated to API key ${(this.keyIndex % this.apiKeys.length) + 1}/${this.apiKeys.length}`);
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.isConfigured) {
      throw new Error('GOOGLE_GENERATIVE_AI_SYNC_API_KEYS not set');
    }

    // Throttle: wait 200ms between embedding calls to avoid burst rate limits
    await new Promise((r) => setTimeout(r, 200));

    const maxAttempts = this.apiKeys.length * 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = this.currentKey;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/gemini-embedding-001',
              content: { parts: [{ text }] },
              outputDimensionality: 3072,
            }),
          },
        );

        if (res.status === 429) {
          this.logger.warn(`Embedding rate limited (429) — rotating key and retrying`);
          this.rotateKey();
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Gemini embedding error: ${res.status} ${err}`);
        }

        const data = await res.json();
        const values = data?.embedding?.values ?? [];
        if (!values.length) {
          throw new Error('Gemini embedding returned empty vector');
        }
        return values;
      } catch (err) {
        if (attempt === maxAttempts - 1) throw err;
        this.logger.warn(`Embedding attempt ${attempt + 1} failed, retrying: ${err}`);
        this.rotateKey();
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    throw new Error('Embedding failed after all retries');
  }
}
