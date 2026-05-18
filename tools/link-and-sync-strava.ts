import { loadConfig, resolveConfigSecrets, CONFIG_FILE } from "../packages/core/src/config.js";
import { EmbeddingSync } from "../packages/core/src/embeddings/sync.js";
import { parseArgs } from "node:util";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

/**
 * Link and Sync Tool
 * 
 * Automates Strava token exchange and triggers a full historical sync.
 */
async function main() {
  const { values } = parseArgs({
    options: {
      code: { type: "string" },
      days: { type: "string", default: "365" },
      client_id: { type: "string" },
      client_secret: { type: "string" },
    },
  });

  let config = await resolveConfigSecrets(loadConfig());
  const days = parseInt(values.days || "365", 10);

  // Allow manual override of client credentials if provided via flags
  if (values.client_id) config.strava.clientId = values.client_id;
  if (values.client_secret) config.strava.clientSecret = values.client_secret;

  if (!config.strava.clientId || !config.strava.clientSecret) {
    console.error("Error: Strava Client ID or Secret missing in config.");
    console.log("Please provide them via flags: --client_id YOUR_ID --client_secret YOUR_SECRET");
    process.exit(1);
  }

  if (values.code) {
    console.log("\n--- STEP 2: EXCHANGING TOKENS ---");
    console.log("Exchanging for Client ID:", config.strava.clientId);
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: config.strava.clientId,
        client_secret: config.strava.clientSecret,
        code: values.code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange failed:", errText);
      if (errText.includes("invalid")) {
          console.log("\nTIP: Your Client ID or Secret might be wrong. Check Strava Developer Settings.");
      }
      process.exit(1);
    }

    const tokenData = (await tokenRes.json()) as any;
    console.log("Tokens received!");

    // Manually update the config object for immediate use
    config.strava.accessToken = tokenData.access_token;
    config.strava.refreshToken = tokenData.refresh_token;
    config.strava.expiresAt = tokenData.expires_at;

    // Persist tokens to config.yaml for future runs
    if (existsSync(CONFIG_FILE)) {
      let content = readFileSync(CONFIG_FILE, "utf-8");
      const fields = [
        { key: "client_id", val: `"${config.strava.clientId}"` },
        { key: "client_secret", val: config.strava.clientSecret },
        { key: "access_token", val: tokenData.access_token },
        { key: "refresh_token", val: tokenData.refresh_token },
        { key: "expires_at", val: tokenData.expires_at }
      ];

      // First, try to clean up any messy duplicate clientId/clientSecret entries
      content = content.replace(/^\s*clientId:.*$/gm, '');
      content = content.replace(/^\s*clientSecret:.*$/gm, '');

      for (const { key, val } of fields) {
        const regex = new RegExp(`(\\s*${key}:\\s*).*`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, `$1${val}`);
        } else {
          content = content.replace(/(strava:\s*)/, `$1\n    ${key}: ${val}`);
        }
      }
      writeFileSync(CONFIG_FILE, content, "utf-8");
      console.log("Config file updated and cleaned.");
    }
  } else {
    // Check if we already have tokens in config
    if (config.strava.accessToken && config.strava.refreshToken) {
      console.log("\n--- STEP 2: USING EXISTING TOKENS ---");
      console.log("Using existing Strava tokens from config.");
    } else {
      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${config.strava.clientId}&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=read,activity:read_all,profile:read_all`;
      console.log("\n--- STEP 1: LINK STRAVA ---");
      console.log("Using Client ID:", config.strava.clientId);
      console.log("1. Open this URL in your browser:\n");
      console.log(authUrl);
      console.log("\n2. Click 'Authorize'.");
      console.log("3. Copy the 'code' from the URL of the page that fails to load.");
      console.log(`4. Run: npx tsx tools/link-and-sync-strava.ts --code YOUR_CODE --days ${days} --client_id ${config.strava.clientId} --client_secret ${config.strava.clientSecret}\n`);
      process.exit(1);
    }
  }
  
  console.log(`\n--- STEP 3: SYNCING LAST ${days} DAYS TO PINECONE ---`);
  const sync = new EmbeddingSync(config);

  try {
    console.log("Syncing activities (embedding text summaries)...");
    const count = await sync.syncActivities(days);
    console.log(`Successfully upserted ${count} activities to Pinecone.`);
    
    console.log("Syncing athlete profile...");
    const stravaClient = new (await import("../packages/core/src/strava/client.js")).StravaClient(config.strava);
    const athlete = await stravaClient.getAthlete();
    if (athlete) {
        await sync.syncAthleteProfile(athlete as any);
        console.log("Profile upserted.");
    }

    console.log("\n--- SYNC COMPLETE ---");
    console.log("Your coach now has full memory of your history.");
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
}

main();
