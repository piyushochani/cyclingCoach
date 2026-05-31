import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface PineconeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PineconeClient {
  private readonly logger = new Logger(PineconeClient.name);
  private apiKey: string;
  private host: string;
  private indexName: string;
  private namespace: string;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const envKey = process.env.PINECONE_API_KEY;
    const envHost = process.env.PINECONE_HOST;
    const envIndex = process.env.PINECONE_INDEX || 'CyclingCoach';
    const envNamespace = process.env.PINECONE_NAMESPACE || '';

    // Try environment variables first
    if (envKey && envHost) {
      this.apiKey = envKey;
      this.host = envHost;
      this.indexName = envIndex;
      this.namespace = envNamespace;
      return;
    }

    // Fallback to config.yaml
    const configPaths = [
      join(homedir(), '.cycling-coach', 'config.yaml'),
      join(homedir(), '.config', 'cycling-coach', 'config.yaml'),
    ];
    for (const p of configPaths) {
      if (existsSync(p)) {
        try {
          const raw = readFileSync(p, 'utf-8');
          const c = parseYaml(raw) as any;
          const pc = c?.pinecone;
          if (pc?.api_key && pc?.host) {
            this.apiKey = pc.api_key;
            this.host = pc.host;
            this.indexName = pc.index_name || 'CyclingCoach';
            this.namespace = pc.namespace || '';
            return;
          }
        } catch {}
      }
    }

    this.logger.warn('Pinecone not configured — set PINECONE_API_KEY and PINECONE_HOST env vars');
  }

  get isConfigured(): boolean {
    return !!(this.apiKey && this.host);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.host}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Pinecone API error (${method} ${path}): ${error}`);
    }

    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  async upsert(vectors: PineconeVector[]): Promise<void> {
    if (!this.isConfigured) return;
    // Strip null/undefined metadata values (Pinecone rejects them)
    const clean = vectors.map((v) => {
      if (!v.metadata) return v;
      const cleanMeta: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v.metadata)) {
        if (val !== null && val !== undefined) cleanMeta[k] = val;
      }
      return { ...v, metadata: cleanMeta };
    });
    await this.request('POST', '/vectors/upsert', {
      vectors: clean,
      namespace: this.namespace || undefined,
    });
  }

  async query(vector: number[], topK = 10): Promise<{ matches: PineconeMatch[] }> {
    if (!this.isConfigured) return { matches: [] };
    return this.request('POST', '/query', {
      vector,
      topK,
      includeMetadata: true,
      namespace: this.namespace || undefined,
    });
  }

  async list(limit = 100, paginationToken?: string): Promise<{ vectors: { id: string }[]; pagination?: { next: string } }> {
    if (!this.isConfigured) return { vectors: [] };
    const params = new URLSearchParams({ limit: String(limit) });
    if (this.namespace) params.set('namespace', this.namespace);
    if (paginationToken) params.set('paginationToken', paginationToken);
    const res = await fetch(`${this.host}/vectors/list?${params}`, {
      method: 'GET',
      headers: { 'Api-Key': this.apiKey },
    });
    if (!res.ok) return { vectors: [] };
    const data = await res.json();
    return data as { vectors: { id: string }[]; pagination?: { next: string } };
  }

  async fetch(ids: string[]): Promise<Record<string, PineconeVector>> {
    if (!this.isConfigured) return {};
    const params = new URLSearchParams();
    for (const id of ids) params.append('ids', id);
    if (this.namespace) params.set('namespace', this.namespace);
    const url = `${this.host}/vectors/fetch?${params}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Api-Key': this.apiKey },
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data?.vectors ?? {};
  }

  async deleteVectors(ids: string[]): Promise<void> {
    if (!this.isConfigured || ids.length === 0) return;
    const url = `${this.host}/vectors/delete`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids,
        namespace: this.namespace || undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pinecone delete error: ${err}`);
    }
  }

  async deleteAll(prefix?: string): Promise<number> {
    if (!this.isConfigured) return 0;
    const allIds: string[] = [];
    let token: string | undefined;
    do {
      const result = await this.list(100, token);
      for (const v of result.vectors || []) {
        if (!prefix || v.id.startsWith(prefix)) allIds.push(v.id);
      }
      token = result.pagination?.next;
    } while (token);

    if (allIds.length === 0) return 0;

    const url = `${this.host}/vectors/delete`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: allIds,
        namespace: this.namespace || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pinecone delete error: ${err}`);
    }

    return allIds.length;
  }
}
