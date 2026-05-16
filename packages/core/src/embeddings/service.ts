import { embed, embedMany } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { Config } from "../config.js";

export class EmbeddingService {
  private config: Config["llm"];
  private googleAI: ReturnType<typeof createGoogleGenerativeAI> | null;

  constructor(config: Config["llm"]) {
    this.config = config;
    // Initialize Google AI SDK if we're using Google for embeddings
    this.googleAI = config.provider === "google"
      ? createGoogleGenerativeAI({ apiKey: config.apiKey })
      : null;
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.googleAI) {
      throw new Error("EmbeddingService is only configured for Google provider");
    }

    const { embedding } = await embed({
      model: this.googleAI.embedding(this.config.embeddingModel ?? "text-embedding-004"),
      value: text,
    });
    return embedding;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (!this.googleAI) {
      throw new Error("EmbeddingService is only configured for Google provider");
    }

    const { embeddings } = await embedMany({
      model: this.googleAI.embedding(this.config.embeddingModel ?? "text-embedding-004"),
      values: texts,
    });
    return embeddings;
  }
}
