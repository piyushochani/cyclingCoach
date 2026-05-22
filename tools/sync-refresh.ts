import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const backendRequire = createRequire(resolve(dirname(fileURLToPath(import.meta.url)), "../backend/package.json"));
const mongoose = backendRequire("mongoose");
import { loadConfig, resolveConfigSecrets } from "../packages/core/src/config.js";
import { EmbeddingSync } from "../packages/core/src/embeddings/sync.js";
import { PineconeClient } from "../packages/core/src/embeddings/pinecone.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load backend .env
const envPath = resolve(__dirname, "../backend/.env");
try {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
  console.log("Loaded env from", envPath);
} catch {
  console.warn("Could not load", envPath);
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  console.log("Loading config...");
  const config = await resolveConfigSecrets(loadConfig());

  // Step 1: Sync Strava → Pinecone
  console.log("\n=== Step 1: Syncing Strava → Pinecone ===");
  const sync = new EmbeddingSync(config);
  let syncedCount = 0;
  try {
    syncedCount = await sync.syncActivities(90);
    console.log(`Synced ${syncedCount} activities`);
  } catch (err) {
    console.warn("Strava sync failed, continuing with Pinecone data:", err);
  }

  // Step 2: Connect to MongoDB
  console.log("\n=== Step 2: Connecting to MongoDB ===");
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) { console.error("Failed to connect to MongoDB"); process.exit(1); }

  // Step 3: List all activity vectors from Pinecone
  console.log("\n=== Step 3: Listing vectors from Pinecone ===");
  const pinecone = new PineconeClient(config.pinecone);
  const allIds: string[] = [];
  let token: string | undefined;
  do {
    const res = await pinecone.list(100, token);
    for (const v of res.vectors) {
      if (v.id.startsWith("activity_")) allIds.push(v.id);
    }
    token = res.pagination?.next;
  } while (token);
  console.log(`Found ${allIds.length} activity vectors`);

  if (allIds.length === 0) {
    console.log("No activity vectors found, skipping MongoDB import");
    await mongoose.disconnect();
    return;
  }

  // Step 4: Fetch all vectors
  console.log("\n=== Step 4: Fetching vector metadata ===");
  const vectors = await pinecone.fetch(allIds);
  const activities: any[] = [];
  for (const id of allIds) {
    const v = vectors[id];
    if (!v?.metadata) continue;
    const m = v.metadata as Record<string, any>;
    if (m.kind !== "activity") continue;
    activities.push({
      name: m.name || "Unknown",
      sport: m.sportType || "Ride",
      distance: (m.distance || 0) / 1000,
      durationSeconds: m.movingTime || m.elapsedTime || 0,
      elevationGain: m.totalElevationGain || 0,
      date: new Date(m.startDateLocal || Date.now()),
    });
  }
  console.log(`Parsed ${activities.length} activities from vectors`);

  if (activities.length === 0) {
    console.log("No activities to import");
    await mongoose.disconnect();
    return;
  }

  // Step 5: Delete old activities and insert new
  console.log("\n=== Step 5: Updating MongoDB ===");
  const activitiesCol = db.collection("activities");
  const del = await activitiesCol.deleteMany({});
  console.log(`Deleted ${del.deletedCount} activities`);

  // Assign first user as owner
  const usersCol = db.collection("users");
  const firstUser = await usersCol.findOne({});
  const userId = firstUser?._id;
  if (!userId) {
    console.error("No user found in MongoDB");
    await mongoose.disconnect();
    process.exit(1);
  }

  const activityDocs = activities.map((a) => ({ ...a, user: userId }));
  const inserted = await db.collection("activities").insertMany(activityDocs);
  console.log(`Inserted ${inserted.insertedCount} activities`);

  await mongoose.disconnect();
  console.log("\n=== Sync complete ===");
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
