import { loadConfig, resolveConfigSecrets } from "./packages/core/src/config.js";
import { StravaClient } from "./packages/core/src/strava/client.js";

async function testStrava() {
  try {
    console.log("Loading config...");
    const config = await resolveConfigSecrets(loadConfig());
    console.log("Config loaded:");
    console.log(`  Has Access Token: ${!!config.strava.accessToken}`);
    console.log(`  Has Refresh Token: ${!!config.strava.refreshToken}`);

    console.log("\nCreating StravaClient...");
    const stravaClient = new StravaClient(config.strava);
    console.log("StravaClient created successfully!");

    console.log("\nFetching athlete profile...");
    const athlete = await stravaClient.getAthlete();
    console.log(`✅ Athlete profile fetched successfully!`);
    console.log(`  Name: ${athlete.firstname} ${athlete.lastname}`);
    console.log(`  ID: ${athlete.id}`);
    console.log(`  Followers: ${athlete.followers}`);
    console.log(`  Friends: ${athlete.friend}`);

  } catch (error) {
    console.error("❌ Strava Test failed:");
    console.error(error);
    process.exit(1);
  }
}

testStrava();