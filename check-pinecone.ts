import { loadConfig, resolveConfigSecrets } from "./packages/core/src/config.js";
import { PineconeClient } from "./packages/core/src/embeddings/pinecone.js";

async function checkPinecone() {
  try {
    console.log("Loading config...");
    const config = await resolveConfigSecrets(loadConfig());
    console.log("Config loaded:");
    console.log(`  Pinecone API Key: ${config.pinecone.apiKey ? 'present' : 'missing'}`);
    // The indexName in config is actually the full host for our setup
    const host = config.pinecone.indexName;
    console.log(`  Pinecone Host: ${host}`);

    console.log("\nCreating PineconeClient...");
    const pinecone = new PineconeClient(config.pinecone);
    console.log("PineconeClient created successfully!");

    console.log("\nCalling Pinecone Query API (to check connection)...");
    // Try to query with a zero vector to see if the host is correct
    const dummyVector = new Array(1536).fill(0); // Assuming 1536 dimensions for text-embedding-001
    const queryResult = await pinecone.query(dummyVector, 1);
    console.log("✅ Pinecone query successful!");
    console.log(`  Matches found: ${queryResult.matches.length}`);
    console.log(`  Namespace: ${queryResult.namespace || 'default'}`);

    // Let's also try to fetch the root to see if we get any response
    console.log("\nCalling Pinecone root endpoint...");
    const rootRes = await fetch(host, {
      method: "GET",
      headers: {
        "Api-Key": config.pinecone.apiKey,
      },
    });
    console.log(`Root endpoint status: ${rootRes.status}`);
    if (!rootRes.ok) {
      const rootError = await rootRes.text();
      console.log(`Root endpoint error: ${rootError}`);
    } else {
      const rootData = await rootRes.json();
      console.log(`Root endpoint data:`, rootData);
    }

    // Now let's try to get index stats by describing the index via the client if possible
    // Since we don't have describeIndex in the client, we'll try to infer from the host
    // Alternatively, we can check the index stats by querying with a high topK and see if we get any vectors?
    // But that's not efficient and might not give us the total count.

    // Let's just note that we can connect and the index exists.
    console.log("\n✅ Connection to Pinecone index successful!");
    console.log("   (We cannot get total vector count without describeIndex, but the index is accessible)");

  } catch (error) {
    console.error("❌ Pinecone check failed:");
    console.error(error);
    process.exit(1);
  }
}

checkPinecone();