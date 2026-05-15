import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";
import type { Config } from "../config.js";

export class EmbeddingService {
  private config: Config["llm"];

  constructor(config: Config["llm"]) {
    this.config = config;
  }

  async embedText(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: google.embedding(this.config.embeddingModel ?? "text-embedding-004"),
      value: text,
    });
    return embedding;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const { embeddings } = await embedMany({
      model: google.embedding(this.config.embeddingModel ?? "text-embedding-004"),
      values: texts,
    });
    return embeddings;
  }
}
