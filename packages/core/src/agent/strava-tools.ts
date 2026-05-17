import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { StravaClient } from "../strava/client.js";
import type { EmbeddingService } from "../embeddings/service.js";
import type { PineconeClient } from "../embeddings/pinecone.js";

/**
 * Pure-Core Strava tools — replacement for Intervals.icu tools.
 */
export function createStravaTools(
  strava: StravaClient | null,
  embedder?: EmbeddingService,
  pinecone?: PineconeClient,
) {
  const tools: any = {};
  
  if (strava) {
    tools.strava_fetch_athlete = tool({
      description: "Fetch athlete profile from Strava (firstname, lastname, weight, ftp)",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        try {
          return await strava.getAthlete();
        } catch (err) {
          return { error: String(err) };
        }
      },
    });

    tools.strava_fetch_activities = tool({
      description: "Fetch recent activities from Strava.",
      inputSchema: zodSchema(
        z.object({
          before: z.number().optional().describe("An epoch timestamp to use for filtering activities that have taken place before a certain time."),
          after: z.number().optional().describe("An epoch timestamp to use for filtering activities that have taken place after a certain time."),
          page: z.number().optional().describe("Page number. Defaults to 1."),
          per_page: z.number().optional().describe("Number of items per page. Defaults to 30."),
        }),
      ),
      execute: async (input) => {
        try {
          return await strava.listActivities(input);
        } catch (err) {
          return { error: String(err) };
        }
      },
    });

    tools.strava_fetch_activity = tool({
      description: "Fetch a single activity from Strava by ID. Includes laps and detailed metrics.",
      inputSchema: zodSchema(
        z.object({
          activityId: z.number().int().describe("Activity ID from strava_fetch_activities"),
        }),
      ),
      execute: async (input: { activityId: number }) => {
        try {
          return await strava.getActivity(input.activityId);
        } catch (err) {
          return { error: String(err) };
        }
      },
    });
  }

  if (embedder && pinecone) {
    tools.strava_search_history = tool({
      description: "Search athlete's historical activities and profile for relevant information using semantic search.",
      inputSchema: zodSchema(
        z.object({
          query: z.string().describe("The search query (e.g., 'recent intervals', 'FTP tests', 'climbing performance')"),
          limit: z.number().int().min(1).max(20).default(5).describe("Number of relevant matches to return"),
        }),
      ),
      execute: async (input: { query: string; limit: number }) => {
        try {
          const vector = await embedder.embedText(input.query);
          const { matches } = await pinecone.query(vector, input.limit);
          return matches.map(m => ({
            id: m.id,
            score: m.score,
            metadata: m.metadata
          }));
        } catch (err) {
          return { error: String(err) };
        }
      },
    });
  }

  return tools;
}
