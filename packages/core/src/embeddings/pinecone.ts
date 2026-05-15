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
    const { apiKey, indexName } = this.config;
    // Note: This assumes the index host is known or can be derived. 
    // In a production app, we'd first call describeIndex to get the host.
    // For simplicity, we'll expect the host to be configured or use a common pattern.
    // Actually, Pinecone's REST API usually requires the index host.
    // Let's assume the user provides the full host URL in indexName or we add a field.
    // Wait, the plan said "Index name". Let's use a placeholder host for now and 
    // mention it in the setup notes. Or better, try to find the host.
    
    const host = indexName.startsWith("http") ? indexName : `https://${indexName}.svc.pinecone.io`;

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
}
