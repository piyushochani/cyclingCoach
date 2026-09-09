/**
 * Backfill Pinecone vector metadata with summary text from MongoDB.
 *
 * Usage (from backend/):
 *   node scripts/backfill-pinecone-metadata.mjs --dry-run
 *   node scripts/backfill-pinecone-metadata.mjs
 *
 * Requires: MONGODB_URI, PINECONE_API_KEY, PINECONE_HOST
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const dryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500;

const pineconeHost = process.env.PINECONE_HOST;
const pineconeKey = process.env.PINECONE_API_KEY;
const namespace = process.env.PINECONE_NAMESPACE || '';

if (!pineconeHost || !pineconeKey) {
  console.error('Set PINECONE_HOST and PINECONE_API_KEY');
  process.exit(1);
}

function truncate(text, maxLen = 8000) {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen - 3) + '...';
}

async function updateMetadata(vectorId, summary) {
  const res = await fetch(`${pineconeHost}/vectors/update`, {
    method: 'POST',
    headers: { 'Api-Key': pineconeKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: vectorId,
      setMetadata: { summary: truncate(summary) },
      namespace: namespace || undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinecone update failed for ${vectorId}: ${err}`);
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cyclogenai');
  const db = mongoose.connection.db;
  const activities = await db.collection('activities').find({
    vectorId: { $exists: true, $ne: null },
    summaryText: { $exists: true, $ne: null },
  }).limit(limit).toArray();

  console.log(`Found ${activities.length} activities with vectorId + summaryText${dryRun ? ' (dry run)' : ''}`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const a of activities) {
    if (!a.vectorId || !a.summaryText?.trim()) {
      skipped++;
      continue;
    }
    const rich = [a.summaryText.trim(), a.llmAnalysis?.trim()].filter(Boolean).join('\n\nCoach analysis: ');
    if (dryRun) {
      console.log(`[dry-run] would update ${a.vectorId} (${a.summaryText.slice(0, 60)}...)`);
      updated++;
      continue;
    }
    try {
      await updateMetadata(a.vectorId, rich);
      updated++;
      if (updated % 10 === 0) console.log(`Updated ${updated}/${activities.length}...`);
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      failed++;
      console.warn(err.message);
    }
  }

  console.log(`Done: ${updated} updated, ${skipped} skipped, ${failed} failed`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
