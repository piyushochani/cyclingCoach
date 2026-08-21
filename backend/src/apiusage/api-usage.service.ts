import { Injectable, Logger, OnApplicationBootstrap, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { ApiUsage, ApiUsageStatus } from './api-usage.schema';
import { getAllKeyStatuses, loadChatApiKeys, loadSyncApiKeys } from '../common/gemini-key-validator';
import { loadGroqConfig } from '../common/llm-config';

export const FIXED_APISAGE_EMAIL = 'piyushochani0@gmail.com';
const FIXED_APISAGE_PASSWORD = 'piyushochani0@gmail.com';

export interface KeyHealth {
  status: ApiUsageStatus;
  valid: boolean;
  modelAccessible: boolean;
  resetsAt: string | null;
  error: string;
}

@Injectable()
export class ApiUsageService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ApiUsageService.name);

  constructor(
    @InjectModel(ApiUsage.name) private readonly model: Model<ApiUsage>,
    private readonly jwtService: JwtService,
  ) {}

  async onApplicationBootstrap() {
    const intervalMs =
      Number(process.env.APISAGE_REFRESH_INTERVAL_MS || 300000) || 300000;
    setInterval(() => {
      this.refresh().catch((err) =>
        this.logger.error(`Scheduled API usage refresh failed: ${err}`),
      );
    }, intervalMs);
  }

  getKeyHash(key: string): string {
    return createHash('sha256').update(key).digest('hex').slice(0, 16);
  }

  private getSecret(): string {
    const secret = process.env.APISAGE_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
    if (secret) return secret;
    return 'apisage-dev-only-fallback';
  }

  async login(email: string, password: string): Promise<{ token: string; email: string }> {
    if (email !== FIXED_APISAGE_EMAIL || password !== FIXED_APISAGE_PASSWORD) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.jwtService.sign(
      { sub: 'apisage', email: FIXED_APISAGE_EMAIL, role: 'apisage' },
      { secret: this.getSecret(), expiresIn: '12h' },
    );
    return { token, email: FIXED_APISAGE_EMAIL };
  }

  verifyToken(token: string): { role: string; email: string } {
    try {
      const payload = this.jwtService.verify<{ role: string; email: string }>(token, {
        secret: this.getSecret(),
      });
      if (payload.role !== 'apisage') {
        throw new UnauthorizedException('Invalid token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return key.slice(0, 4) + '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  }

  private async upsert(
    provider: string,
    pool: string,
    index: number,
    label: string,
    keyMasked: string,
    keyHash: string,
    apiModel: string,
    health: KeyHealth,
  ): Promise<void> {
    await this.model.findOneAndUpdate(
      { provider, pool, index },
      {
        $set: {
          label,
          keyMasked,
          keyHash,
          apiModel,
          status: health.status,
          valid: health.valid,
          modelAccessible: health.modelAccessible,
          resetsAt: health.resetsAt,
          error: health.error,
          lastChecked: new Date(),
        },
      },
      { upsert: true, new: true },
    );
  }

  private async validateGroqKey(key: string, model: string): Promise<KeyHealth> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
      });

      if (response.ok) {
        return { status: 'healthy', valid: true, modelAccessible: true, resetsAt: null, error: '' };
      }

      const body = await response.text().catch(() => '');

      if (response.status === 429) {
        return {
          status: 'exhausted',
          valid: true,
          modelAccessible: true,
          resetsAt: null,
          error: `429 — ${body.slice(0, 150)}`,
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          status: 'invalid',
          valid: false,
          modelAccessible: false,
          resetsAt: null,
          error: `${response.status} — ${body.slice(0, 150)}`,
        };
      }

      return {
        status: 'invalid',
        valid: false,
        modelAccessible: false,
        resetsAt: null,
        error: `${response.status}: ${body.slice(0, 150)}`,
      };
    } catch (err: any) {
      return {
        status: 'invalid',
        valid: false,
        modelAccessible: false,
        resetsAt: null,
        error: `Network error: ${err?.message || err}`,
      };
    }
  }

  async refresh(): Promise<ApiUsage[]> {
    this.logger.log('Refreshing API usage statuses');

    const geminiStatuses = await getAllKeyStatuses();
    const rawChatKeys = loadChatApiKeys();
    const rawSyncKeys = loadSyncApiKeys();
    for (const s of geminiStatuses) {
      const rawKey = s.pool === 'chat' ? rawChatKeys[s.index - 1] : rawSyncKeys[s.index - 1];
      const status: ApiUsageStatus = !s.valid
        ? 'invalid'
        : s.exhausted
          ? 'exhausted'
          : 'healthy';
      await this.upsert(
        'google',
        s.pool,
        s.index,
        `Gemini Key #${s.index} (${s.pool})`,
        s.keyMasked,
        rawKey ? this.getKeyHash(rawKey) : '',
        'gemini',
        {
          status,
          valid: s.valid,
          modelAccessible: s.modelAccessible,
          resetsAt: s.resetsAt,
          error: s.error || '',
        },
      );
    }

    const groqConfig = loadGroqConfig();
    if (groqConfig) {
      for (let i = 0; i < groqConfig.apiKeys.length; i++) {
        const key = groqConfig.apiKeys[i];
        const health = await this.validateGroqKey(key, groqConfig.model);
        await this.upsert(
          'groq',
          '',
          i + 1,
          `Groq Key #${i + 1}`,
          this.maskKey(key),
          this.getKeyHash(key),
          groqConfig.model,
          health,
        );
      }
    }

    return this.getAll();
  }

  async getAll(): Promise<ApiUsage[]> {
    return this.model.find().sort({ provider: 1, pool: 1, index: 1 }).lean().exec();
  }

  async getHealthy(provider?: string, pool?: string): Promise<ApiUsage[]> {
    const query: Record<string, unknown> = { status: 'healthy' };
    if (provider) query.provider = provider;
    if (pool) query.pool = pool;
    return this.model.find(query).sort({ index: 1 }).lean().exec();
  }

  async getUnhealthyHashes(): Promise<string[]> {
    const docs = await this.model
      .find({ status: { $in: ['exhausted', 'invalid'] } })
      .select('keyHash status')
      .lean()
      .exec();
    return docs.filter((d) => d.keyHash).map((d) => d.keyHash);
  }

  async summary(docs: ApiUsage[]) {
    return {
      total: docs.length,
      healthy: docs.filter((d) => d.status === 'healthy').length,
      exhausted: docs.filter((d) => d.status === 'exhausted').length,
      invalid: docs.filter((d) => d.status === 'invalid').length,
      unknown: docs.filter((d) => d.status === 'unknown').length,
    };
  }
}