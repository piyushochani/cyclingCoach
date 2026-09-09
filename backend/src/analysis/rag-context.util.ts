import { PineconeMatch } from './pinecone-client';

export const DEFAULT_RAG_MIN_SCORE = parseFloat(process.env.PINECONE_MIN_SCORE || '0.5');

export function truncateForMetadata(text: string, maxLen = 8000): string {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen - 3) + '...';
}

export function buildRichSummary(summaryText: string, llmAnalysis?: string | null): string {
  const parts = [summaryText?.trim()].filter(Boolean);
  if (llmAnalysis?.trim()) {
    parts.push(`Coach analysis: ${llmAnalysis.trim()}`);
  }
  return truncateForMetadata(parts.join('\n\n'));
}

export function filterRagMatches(matches: PineconeMatch[], minScore = DEFAULT_RAG_MIN_SCORE): PineconeMatch[] {
  return (matches || [])
    .filter((m) => m.score >= minScore && m.metadata?.summary)
    .sort((a, b) => b.score - a.score);
}

export function formatRagMatchesForAgent(matches: PineconeMatch[]): string {
  const filtered = filterRagMatches(matches);
  if (filtered.length === 0) return '';

  const blocks = filtered.map((m, i) => {
    const meta = m.metadata as Record<string, unknown>;
    const date = meta.date ? String(meta.date) : 'Unknown date';
    const session = meta.sessionType ? String(meta.sessionType) : 'ride';
    const distance = meta.distanceKm != null ? `${Number(meta.distanceKm).toFixed(1)} km` : '';
    const duration = meta.durationMin != null ? `${Math.round(Number(meta.durationMin))} min` : '';
    const scorePct = Math.round(m.score * 100);
    const summary = String(meta.summary || '').trim();
    const stats = [distance, duration].filter(Boolean).join(' · ');
    const header = `### ${i + 1}. ${date} — ${session}${stats ? ` (${stats})` : ''} — ${scorePct}% match`;
    return `${header}\n${summary}`;
  });

  return [
    '## Retrieved from your ride history',
    'Use these past rides for context. Cite specific dates and session types when relevant.',
    '',
    ...blocks,
  ].join('\n');
}

export function formatRagMatchesForReview(matches: PineconeMatch[]): string {
  const filtered = filterRagMatches(matches);
  if (filtered.length === 0) return '';

  const entries = filtered.map((m, i) => {
    const meta = m.metadata as Record<string, unknown>;
    const scorePct = Math.round(m.score * 100);
    const date = meta.date ? String(meta.date) : '';
    const session = meta.sessionType ? String(meta.sessionType) : 'ride';
    return `[Past ride ${i + 1}] ${date} ${session} (${scorePct}% relevance)\n${String(meta.summary || '').trim()}`;
  });

  return `## Relevant Historical Activities\n\n${entries.join('\n\n')}`;
}

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/** Build Pinecone metadata filter from userId + optional query hints. */
export function buildRagQueryFilter(userId: string, query?: string): Record<string, unknown> {
  const filter: Record<string, unknown> = { userId: { $eq: userId } };
  const q = (query || '').toLowerCase();

  if (/\b(last|past)\s+(week|7\s*days?)\b/.test(q)) {
    filter.date = { $gte: isoDateDaysAgo(7) };
  } else if (/\b(last|past)\s+(month|30\s*days?)\b/.test(q)) {
    filter.date = { $gte: isoDateDaysAgo(30) };
  } else if (/\b(last|past)\s+(3\s*months?|90\s*days?|quarter)\b/.test(q)) {
    filter.date = { $gte: isoDateDaysAgo(90) };
  }

  if (/\b(interval|vo2|threshold|tempo|sweet\s*spot)\b/.test(q)) {
    filter.sessionType = { $in: ['VO2max', 'threshold', 'tempo', 'sweet spot', 'interval'] };
  } else if (/\b(endurance|long\s*ride|base)\b/.test(q)) {
    filter.sessionType = { $in: ['endurance', 'recovery'] };
  } else if (/\b(race|event)\b/.test(q)) {
    filter.sessionType = { $eq: 'race-like' };
  }

  if (/\b(indoor|trainer|zwift)\b/.test(q)) {
    filter.hasPower = { $eq: true };
  }

  return filter;
}
