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

    return (await res.json()) as T;
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
    return this.request("/vectors/list", {
      namespace: this.config.namespace,
      limit,
      paginationToken,
    });
  }

  async fetch(ids: string[]): Promise<Record<string, PineconeVector>> {
    const res = await this.request<{ vectors: Record<string, PineconeVector> }>("/vectors/fetch", {
      ids,
      namespace: this.config.namespace,
    });
    return res.vectors;
  }
}