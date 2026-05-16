import { loadConfig, resolveConfigSecrets } from "../packages/core/src/config.js";
import { EmbeddingSync } from "../packages/core/src/embeddings/sync.js";
import { parseArgs } from "node:util";

/**
 * Historical Sync Tool
 * 
 * Usage: tsx tools/sync-historical-strava.ts --days 365
 */
async function main() {
  const { values } = parseArgs({
    options: {
      days: { type: "string", short: "d", default: "90" },
    },
    strict: false, // Allow unknown flags or positional args without throwing
  });

  const daysStr = values.days ?? "90";
  const days = parseInt(daysStr, 10);
  
  if (isNaN(days)) {
    console.error(`Error: '${daysStr}' is not a valid number for days.`);
    process.exit(1);
  }

  console.log(`Starting historical sync for the last ${days} days...`);

  const config = await resolveConfigSecrets(loadConfig());
  
  if (!config.strava.clientId || !config.pinecone.apiKey) {
    console.error("Error: Strava or Pinecone configuration missing. Run 'npm run setup' first.");
    process.exit(1);
  }

  const sync = new EmbeddingSync(config);

  try {
    console.log("Fetching and embedding activities (this may take a while)...");
    const count = await sync.syncActivities(days);
    console.log(`Successfully synced ${count} activities to Pinecone.`);
    
    console.log("Syncing athlete profile...");
    await sync.syncAthleteProfile({
      firstname: "Athlete", // EmbeddingSync will try to get more from Strava if needed
    });
    console.log("Profile synced.");

  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
}

main();
