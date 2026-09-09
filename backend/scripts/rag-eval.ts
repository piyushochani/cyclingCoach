/**
 * RAG retrieval eval harness (C7).
 *
 * Usage:
 *   cp eval/rag-queries.example.json eval/rag-queries.json
 *   # Edit eval/rag-queries.json with real userId + expected activity IDs
 *   npm run eval:rag
 *
 * Options (env):
 *   RAG_EVAL_DATASET=eval/rag-queries.json
 *   RAG_EVAL_TOP_K=5
 *   RAG_EVAL_MIN_SCORE=0.5
 */
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { EmbeddingService } from '../src/analysis/embedding.service';
import { PineconeClient } from '../src/analysis/pinecone-client';
import { buildRagQueryFilter, DEFAULT_RAG_MIN_SCORE } from '../src/analysis/rag-context.util';

interface EvalCase {
  userId: string;
  query: string;
  expectedActivityIds: string[];
  description?: string;
  expectedInTopK?: number;
}

function loadDataset(): EvalCase[] {
  const datasetPath = process.env.RAG_EVAL_DATASET || join(__dirname, '..', 'eval', 'rag-queries.json');
  const fallback = join(__dirname, '..', 'eval', 'rag-queries.example.json');
  const path = existsSync(datasetPath) ? datasetPath : fallback;

  const raw = readFileSync(path, 'utf-8');
  const cases = JSON.parse(raw) as EvalCase[];

  if (cases.some((c) => c.userId.includes('REPLACE_WITH'))) {
    console.error(`\nEdit ${path} — replace REPLACE_WITH_TEST_USER_ID with a real Mongo user ID.\n`);
    process.exit(1);
  }

  return cases;
}

function extractActivityId(match: { metadata?: Record<string, unknown> }): string | null {
  const meta = match.metadata || {};
  if (meta.activityId) return String(meta.activityId);
  if (meta.stravaId) return String(meta.stravaId);
  return null;
}

async function main() {
  const embedder = new EmbeddingService();
  const pinecone = new PineconeClient();

  if (!embedder.isConfigured) {
    console.error('EmbeddingService not configured (GOOGLE_GENERATIVE_AI_API_KEY required)');
    process.exit(1);
  }
  if (!pinecone.isConfigured) {
    console.error('Pinecone not configured (PINECONE_API_KEY + PINECONE_HOST required)');
    process.exit(1);
  }

  const topK = parseInt(process.env.RAG_EVAL_TOP_K || '5', 10);
  const minScore = parseFloat(process.env.RAG_EVAL_MIN_SCORE || String(DEFAULT_RAG_MIN_SCORE));
  const cases = loadDataset();

  let hits = 0;
  let totalExpected = 0;
  let mrrSum = 0;
  let emptyResults = 0;

  console.log(`\nRAG Eval — ${cases.length} cases, topK=${topK}, minScore=${minScore}\n`);

  for (const [i, evalCase] of cases.entries()) {
    const label = evalCase.description || evalCase.query.slice(0, 50);
    const vector = await embedder.embedText(evalCase.query);
    const { matches } = await pinecone.query(vector, topK, {
      filter: buildRagQueryFilter(evalCase.userId, evalCase.query),
      minScore,
    });

    const retrievedIds = matches
      .map(extractActivityId)
      .filter((id): id is string => !!id);

    if (retrievedIds.length === 0) emptyResults++;

    const expected = evalCase.expectedActivityIds || [];
    const k = evalCase.expectedInTopK ?? topK;
    const topIds = retrievedIds.slice(0, k);

    let caseHit = false;
    let reciprocalRank = 0;

    for (const expectedId of expected) {
      totalExpected++;
      const rank = topIds.indexOf(expectedId);
      if (rank >= 0) {
        hits++;
        caseHit = true;
        reciprocalRank = Math.max(reciprocalRank, 1 / (rank + 1));
      }
    }

    if (expected.length > 0) mrrSum += reciprocalRank;

    const status = expected.length === 0
      ? `(baseline — ${retrievedIds.length} results)`
      : caseHit ? 'HIT' : 'MISS';

    console.log(`[${i + 1}] ${status} — ${label}`);
    console.log(`     query: "${evalCase.query}"`);
    console.log(`     retrieved: [${retrievedIds.slice(0, k).join(', ') || 'none'}]`);
    if (expected.length > 0) {
      console.log(`     expected:  [${expected.join(', ')}]`);
    }
    console.log('');
  }

  const recall = totalExpected > 0 ? (hits / totalExpected) * 100 : 0;
  const mrr = cases.filter((c) => c.expectedActivityIds?.length).length > 0
    ? mrrSum / cases.filter((c) => c.expectedActivityIds?.length).length
    : 0;

  console.log('--- Summary ---');
  console.log(`Recall@${topK}: ${recall.toFixed(1)}% (${hits}/${totalExpected} expected IDs found)`);
  console.log(`MRR: ${mrr.toFixed(3)}`);
  console.log(`Empty results: ${emptyResults}/${cases.length} cases`);
  console.log('');

  if (totalExpected > 0 && recall < 50) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
