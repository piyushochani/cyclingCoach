import type { Config } from "../config.js";

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

export interface PineconeQueryResponse {
  matches: PineconeMatch[];
  namespace: string;
}

export class PineconeClient {
  private config: Config["pinecone"];

  constructor(config: Config["pinecone"]) {
    this.config = config;
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const { apiKey, host, indexName } = this.config;

    const res = await fetch(`${host}${path}`, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Pinecone API error (${path}): ${error}`);
    }

    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  async upsert(vectors: PineconeVector[]): Promise<void> {
    await this.request("/vectors/upsert", {
      vectors,
      namespace: this.config.namespace,
    });
  }

  async query(vector: number[], topK: number = 10): Promise<PineconeQueryResponse> {
    return this.request<PineconeQueryResponse>("/query", {
      vector,
      topK,
      includeMetadata: true,
      namespace: this.config.namespace,
    });
  }

  async list(limit: number = 100, paginationToken?: string): Promise<{ vectors: { id: string }[]; pagination?: { next: string } }> {
    const { apiKey, host, namespace } = this.config;
    const params = new URLSearchParams({ limit: String(limit) });
    if (namespace) params.set("namespace", namespace);
    if (paginationToken) params.set("paginationToken", paginationToken);
    const res = await fetch(`${host}/vectors/list?${params}`, {
      method: "GET",
      headers: { "Api-Key": apiKey },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Pinecone API error (list): ${error}`);
    }
    const text = await res.text();
    if (!text) return { vectors: [], pagination: undefined };
    return JSON.parse(text) as { vectors: { id: string }[]; pagination?: { next: string } };
  }

  async fetch(ids: string[]): Promise<Record<string, PineconeVector>> {
    const { apiKey, host, namespace } = this.config;
    const params = new URLSearchParams();
    for (const id of ids) params.append("ids", id);
    if (namespace) params.set("namespace", namespace);
    const res = await fetch(`${host}/vectors/fetch?${params}`, {
      method: "GET",
      headers: { "Api-Key": apiKey },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Pinecone API error (fetch): ${error}`);
    }
    const text = await res.text();
    if (!text) return {};
    const data = JSON.parse(text) as { vectors: Record<string, PineconeVector> };
    return data?.vectors ?? {};
  }
}