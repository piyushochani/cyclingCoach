import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { StravaClient } from "../strava/client.js";

/**
 * Pure-Core Strava tools — replacement for Intervals.icu tools.
 */
export function createStravaTools(strava: StravaClient | null) {
  if (!strava) return {};
  return {
    strava_fetch_athlete: tool({
      description: "Fetch athlete profile from Strava (firstname, lastname, weight, ftp)",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        try {
          return await strava.getAthlete();
        } catch (err) {
          return { error: String(err) };
        }
      },
    }),

    strava_fetch_activities: tool({
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
    }),

    strava_fetch_activity: tool({
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
    }),
  };
}
