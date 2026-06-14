import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { EmbeddingService } from '../analysis/embedding.service';

export interface FaqChunk {
  id: string;
  category: string;
  question: string;
  content: string;
  heading: string;
}

interface FaqChunkWithVector extends FaqChunk {
  vector: number[];
}

@Injectable()
export class FaqService implements OnModuleInit {
  private readonly logger = new Logger(FaqService.name);
  private chunks: FaqChunk[] = [];
  private vectors: Float64Array[] | null = null;
  private ready = false;
  private readonly cachePath: string;

  constructor(private readonly embedder: EmbeddingService) {
    this.cachePath = join(__dirname, '..', '..', 'data', 'faq-embeddings.json');
  }

  async onModuleInit() {
    try {
      const p = join(__dirname, '..', '..', 'data', 'faq-chunks.json');
      if (existsSync(p)) {
        this.chunks = JSON.parse(readFileSync(p, 'utf-8'));
        this.logger.log(`Loaded ${this.chunks.length} FAQ chunks`);
        if (existsSync(this.cachePath)) {
          const cached = JSON.parse(readFileSync(this.cachePath, 'utf-8'));
          if (cached.length === this.chunks.length) {
            this.vectors = cached.map((v: number[]) => new Float64Array(v));
            this.ready = true;
            this.logger.log(`FAQ embeddings loaded from cache (${cached.length} chunks)`);
            return;
          }
          this.logger.log('Cache size mismatch — re-embedding');
        }
        this.embedBackground();
      } else {
        this.logger.warn(`FAQ chunks file not found at ${p}`);
      }
    } catch (err) {
      this.logger.error(`Failed to load FAQ chunks: ${err}`);
    }
  }

  private async embedBackground() {
    try {
      if (!this.embedder.isConfigured) {
        this.logger.warn('Embedding service not configured — FAQ search will use keyword fallback');
        this.ready = true;
        return;
      }
      const allVectors: Float64Array[] = [];
      for (let i = 0; i < this.chunks.length; i++) {
        const text = `${this.chunks[i].question}\n${this.chunks[i].content}`.slice(0, 2000);
        const vec = await this.embedder.embedText(text);
        if (vec && vec.length > 0) {
          allVectors.push(new Float64Array(vec));
        } else {
          allVectors.push(new Float64Array(3072));
        }
        if ((i + 1) % 10 === 0) {
          this.logger.log(`Embedded ${i + 1}/${this.chunks.length} FAQ chunks`);
        }
      }
      this.vectors = allVectors;
      this.ready = true;
      try {
        const toCache = allVectors.map((v) => Array.from(v));
        writeFileSync(this.cachePath, JSON.stringify(toCache), 'utf-8');
        this.logger.log(`FAQ embeddings cached to disk (${allVectors.length} chunks)`);
      } catch (err) {
        this.logger.warn(`Failed to cache FAQ embeddings: ${err}`);
      }
      this.logger.log(`FAQ embeddings ready (${this.chunks.length} chunks)`);
    } catch (err) {
      this.logger.error(`FAQ embedding failed: ${err}`);
      this.ready = true;
    }
  }

  async search(query: string, k = 5): Promise<{ chunk: FaqChunk; score: number }[]> {
    if (!this.chunks.length) return [];

    if (!this.vectors || !this.ready) {
      return this.keywordSearch(query, k);
    }

    try {
      const qVec = await this.embedder.embedText(query.slice(0, 2000));
      if (!qVec || qVec.length === 0) {
        return this.keywordSearch(query, k);
      }

      const qFloat = new Float64Array(qVec);
      const scored: { index: number; score: number }[] = [];

      for (let i = 0; i < this.vectors.length; i++) {
        const score = cosineSimilarity(qFloat, this.vectors[i]);
        scored.push({ index: i, score });
      }

      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, k);

      return top
        .filter((s) => s.score > 0.3)
        .map((s) => ({
          chunk: this.chunks[s.index],
          score: s.score,
        }));
    } catch (err) {
      this.logger.warn(`FAQ semantic search failed: ${err}`);
      return this.keywordSearch(query, k);
    }
  }

  private keywordSearch(query: string, k: number): { chunk: FaqChunk; score: number }[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];

    const scored: { chunk: FaqChunk; score: number }[] = [];

    for (const chunk of this.chunks) {
      const text = (chunk.question + ' ' + chunk.content + ' ' + chunk.category).toLowerCase();
      let matches = 0;
      for (const term of terms) {
        if (text.includes(term)) matches++;
      }
      if (matches > 0) {
        scored.push({ chunk, score: matches / terms.length });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  get readyStatus(): boolean {
    return this.ready;
  }
}

function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
