/**
 * Focused tests for rag-context.util.ts formatting.
 * Run: npx ts-node -r dotenv/config scripts/test-rag-context.ts
 */
import {
  truncateForMetadata,
  buildRichSummary,
  filterRagMatches,
  formatRagMatchesForAgent,
  formatRagMatchesForReview,
  buildRagQueryFilter,
} from '../src/analysis/rag-context.util';
import { PineconeMatch } from '../src/analysis/pinecone-client';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

const sampleMatches: PineconeMatch[] = [
  {
    id: 'user1-activity_123',
    score: 0.82,
    metadata: {
      date: '2026-07-20',
      sessionType: 'threshold',
      distanceKm: 45.2,
      durationMin: 95,
      summary: '45 km threshold ride on rolling terrain.',
    },
  },
  {
    id: 'user1-activity_456',
    score: 0.35,
    metadata: {
      date: '2026-07-15',
      sessionType: 'endurance',
      summary: 'Low relevance ride — should be filtered out.',
    },
  },
  {
    id: 'user1-activity_789',
    score: 0.71,
    metadata: {
      date: '2026-07-10',
      sessionType: 'VO2max',
      distanceKm: 32,
      durationMin: 60,
      summary: 'Interval session with 5x4min efforts.',
    },
  },
];

console.log('truncateForMetadata');
assert(truncateForMetadata('hello').length === 5, 'passes through short text');
assert(truncateForMetadata('x'.repeat(9000)).length === 8000, 'truncates long text');

console.log('\nbuildRichSummary');
const rich = buildRichSummary('Base summary', 'Good pacing today.');
assert(rich.includes('Base summary'), 'includes summaryText');
assert(rich.includes('Coach analysis: Good pacing today.'), 'includes llmAnalysis');

console.log('\nfilterRagMatches');
const filtered = filterRagMatches(sampleMatches, 0.5);
assert(filtered.length === 2, 'filters by minScore 0.5');
assert(filtered.every((m) => m.score >= 0.5), 'all matches above threshold');

console.log('\nformatRagMatchesForAgent');
const agentOutput = formatRagMatchesForAgent(sampleMatches);
assert(agentOutput.includes('## Retrieved from your ride history'), 'has header');
assert(agentOutput.includes('2026-07-20 — threshold'), 'includes date and session');
assert(agentOutput.includes('82% match'), 'includes match percentage');
assert(!agentOutput.includes('Low relevance ride'), 'excludes low-score match');

console.log('\nformatRagMatchesForReview');
const reviewOutput = formatRagMatchesForReview(sampleMatches);
assert(reviewOutput.includes('## Relevant Historical Activities'), 'has review header');
assert(reviewOutput.includes('71% relevance'), 'includes relevance pct');

console.log('\nbuildRagQueryFilter');
const weekFilter = buildRagQueryFilter('user123', 'rides from last week');
assert((weekFilter.userId as any).$eq === 'user123', 'always filters by userId');
assert(!!weekFilter.date, 'last week adds date filter');

const intervalFilter = buildRagQueryFilter('user123', 'my interval sessions');
assert(!!intervalFilter.sessionType, 'interval query adds sessionType filter');

const plainFilter = buildRagQueryFilter('user123', 'how am I progressing');
assert(Object.keys(plainFilter).length === 1, 'plain query only has userId filter');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
