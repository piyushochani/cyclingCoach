import { loadConfig, resolveConfigSecrets, CONFIG_FILE } from "../packages/core/src/config.js";
import { StravaClient } from "../packages/core/src/strava/client.js";
import { parseArgs } from "node:util";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

/**
 * Manual Strava Token Exchange
 */
async function main() {
  const { values } = parseArgs({
    options: {
      code: { type: "string" },
    },
  });

  const config = await resolveConfigSecrets(loadConfig());
  
  if (!values.code) {
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${config.strava.clientId}&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=read,activity:read_all,profile:read_all`;
    console.log("\nNo code provided. Please follow these steps:");
    console.log("1. Open this URL in your browser:\n");
    console.log(authUrl);
    console.log("\n2. Click 'Authorize'.");
    console.log("3. You will be redirected to a 'localhost' page that fails to load. Copy the 'code' parameter from that URL.");
    console.log("4. Run this command again with the code: npx tsx tools/manual-strava-token.ts --code <THE_CODE>\n");
    process.exit(1);
  }

  console.log("Exchanging code for tokens...");

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.strava.clientId,
      client_secret: config.strava.clientSecret,
      code: values.code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    console.error("Token exchange failed:", await res.text());
    process.exit(1);
  }

  const data = (await res.json()) as any;
  console.log("Tokens received successfully!");

  // Manual update of config.yaml to avoid extra dependencies in the tool
  if (existsSync(CONFIG_FILE)) {
    let content = readFileSync(CONFIG_FILE, "utf-8");
    
    // Simple regex replacement to update/add tokens in YAML without needing a heavy parser
    const fields = [
      { key: "access_token", val: data.access_token },
      { key: "refresh_token", val: data.refresh_token },
      { key: "expires_at", val: data.expires_at }
    ];

    for (const { key, val } of fields) {
      const regex = new RegExp(`(${key}:\\s*).*`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `$1${val}`);
      } else {
        // If it doesn't exist, try to append it under the strava section
        content = content.replace(/(strava:\s*)/, `$1\n    ${key}: ${val}`);
      }
    }

    writeFileSync(CONFIG_FILE, content, "utf-8");
    console.log(`Updated ${CONFIG_FILE} with new tokens.`);
  }

  console.log("\nYou can now run the historical sync: npx tsx tools/sync-historical-strava.ts --days 365");
}

main();
