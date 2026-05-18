// Adapted from CrankAddict/section-11 (MIT, 2026); see NOTICE.md.

import type { StravaClient } from "../../strava/client.js";
import type { FetchedReference } from "./run-sync.js";

/**
 * Strava production fetcher.
 */
export function makeProductionFetcher(deps: {
  strava: StravaClient | null;
}): (signal: AbortSignal) => Promise<FetchedReference> {
  return async () => {
    if (!deps.strava) {
      throw new Error("Strava client not initialized");
    }
    return await fetchOnce(deps.strava);
  };
}

async function fetchOnce(client: StravaClient): Promise<FetchedReference> {
  const athlete = await client.getAthlete().catch(() => ({}));

  return {
    latest: {
      athlete_profile: athlete,
      current_status: {},
      derived_metrics: {},
      recent_activities: [],
      planned_workouts: [],
      wellness_data: {},
    },
    history: { daily: [], weekly: [], monthly: [] },
    intervals: { by_activity: {} },
    routes: { routes: [] },
    ftp_history: { entries: [] },
  };
}
