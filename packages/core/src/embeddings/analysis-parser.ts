/**

 * Pure deterministic parser for a single Strava cycling activity.
 *
 * Takes raw activity + streams + athlete profile and produces a structured
 * ParsedRide with computed metrics, zone times, and data-quality signals.
 *
 * This module contains NO LLM calls, NO side effects, and NO network I/O.
 * It is deliberately minimal — see TODO comments for planned enhancements.
 */

import type { StravaActivity, AthleteProfile, Streams } from "../strava/client.js";

// ─── Power zone thresholds (Coggan 7-zone model, fraction of FTP) ─────────

const POWER_ZONE_CAPS = [
  { zone: 1, maxFrac: 0.55 },
  { zone: 2, maxFrac: 0.75 },
  { zone: 3, maxFrac: 0.87 },
  { zone: 4, maxFrac: 1.00 },
  { zone: 5, maxFrac: 1.20 },
  { zone: 6, maxFrac: 1.50 },
] as const;

// z7 is anything above 1.50 × FTP

// ─── Output shape ──────────────────────────────────────────────────────────

export interface ParsedRide {
  // Identifiers
  id: number;
  sportType: string;
  startDateLocal: string;
  name: string;

  // Core metrics
  distanceMeters: number;
  movingTimeSeconds: number;
  elapsedTimeSeconds: number;
  totalElevationGain: number;
  avgSpeedKmh: number;

  // Power / energy
  avgPower: number | null;
  kJ: number | null;

  // Data-quality flags
  hasPowerData: boolean;
  hasHrData: boolean;
  powerDropoutSeconds: number;
  hrDropoutSeconds: number;
  unrealisticSpikes: number;

  // Time-in-zone (power, 7-zone Coggan model)
  z1_seconds: number;
  z2_seconds: number;
  z3_seconds: number;
  z4_seconds: number;
  z5_seconds: number;
  z6_seconds: number;
  z7_seconds: number;

  // Classification
  sessionType: "Endurance" | "Unknown";
  hardTags: string[];
}

// ─── Pure parser ───────────────────────────────────────────────────────────

/**
 * Produce a structured ParsedRide from the three inputs that are always
 * available before any LLM call.
 *
 * The function is:
 *   - **Deterministic** — same inputs always produce the same result.
 *   - **Side-effect free** — no I/O, no logging, no global state.
 *   - **Minimal** — only the metrics that can be computed directly from the
 *     raw data; complex inference is left for later pipeline stages.
 *
 * TODO: Add NP / IF / TSS computation once FTP is required (requires the
 *       athlete's CP or FTP curve, not just a single value).
 *
 * TODO: Add interval detection (lap-based or power-based) and per-interval
 *       metrics.
 *
 * TODO: Derive sessionType from power-profile shape (e.g. threshold vs
 *       endurance vs sprint) rather than always defaulting to "Endurance".
 *
 * TODO: Populate hardTags from weather, surface, gear, and lap purpose
 *       markers (e.g. "sweet-spot", "climbing", "race").
 *
 * TODO: Add HR zone time once maxHeartRate is reliably available in the
 *       athlete profile.
 * 
 * TODO: Detect standing / seated segments from cadence-power ratio.
 *
 * TODO: Surface grade / elevation profile classification (flat, rolling,
 *       hilly).
 *
 * TODO: Compute RPE
 * the user.
 *
 * TODO: Surface per-kilometer splits.
 */
export function parseStravaActivity(
  rawActivity: StravaActivity,
  streams: Streams,
  profile: AthleteProfile,
): ParsedRide {
  const ftp = profile.ftp ?? 250; // TODO: make FTP required once the
  // reference pipeline guarantees it

  // ── 1. Core fields ────────────────────────────────────────────────────

  const id = rawActivity.id;
  const sportType = rawActivity.sport_type ?? rawActivity.type;
  const startDateLocal = rawActivity.start_date_local;
  const name = rawActivity.name;

  const distanceMeters = rawActivity.distance;
  const movingTimeSeconds = rawActivity.moving_time;
  const elapsedTimeSeconds = rawActivity.elapsed_time;
  const totalElevationGain = rawActivity.total_elevation_gain ?? 0;

  const avgSpeedKmh =
    movingTimeSeconds > 0 ? (distanceMeters / movingTimeSeconds) * 3.6 : 0;

  // TODO: prefer weighted_average_watts when available (Strava now surfaces
  //       it for rides with variable power)
  const avgPower = rawActivity.average_watts ?? null;

  // TODO: prefer kilojoules from activity object when available; fall back
  //       to integration from power stream (NP-based).
  const kJ = avgPower !== null && movingTimeSeconds > 0
    ? Math.round((avgPower * movingTimeSeconds) / 1000)
    : rawActivity.kilojoules ?? null;

  // ── 2. Data quality ───────────────────────────────────────────────────

  const watts = streams.watts ?? [];
  const heartrate = streams.heartrate ?? [];

  const hasPowerData = watts.length > 0;
  const hasHrData = heartrate.length > 0;

  const powerDropoutSeconds = countDropouts(watts);
  const hrDropoutSeconds = countDropouts(heartrate);

  // TODO: refine spike detection — flag only strokes that exceed both an
  //       absolute ceiling AND a rolling multiple of recent average.
  const unrealisticSpikes = countUnrealisticSpikes(watts, avgPower);

  // ── 3. Zone time (power, 7-zone Coggan) ───────────────────────────────

  let z1 = 0, z2 = 0, z3 = 0, z4 = 0, z5 = 0, z6 = 0, z7 = 0;

  if (hasPowerData) {
    for (let i = 0; i < watts.length; i++) {
      const w = watts[i];
      if (w == null || w <= 0 || !isFinite(w)) continue;

      const frac = w / ftp;
      if (frac >= POWER_ZONE_CAPS[5].maxFrac) { z7++; continue; }
      if (frac >= POWER_ZONE_CAPS[4].maxFrac) { z6++; continue; }
      if (frac >= POWER_ZONE_CAPS[3].maxFrac) { z5++; continue; }
      if (frac >= POWER_ZONE_CAPS[2].maxFrac) { z4++; continue; }
      if (frac >= POWER_ZONE_CAPS[1].maxFrac) { z3++; continue; }
      if (frac >= POWER_ZONE_CAPS[0].maxFrac) { z2++; continue; }
      z1++;
    }
  }

  // ── 4. Session tags ───────────────────────────────────────────────────

  const sessionType = "Endurance"; // TODO: infer from power-profile shape,
  // interval presence, or LLM description.
  const hardTags: string[] = ["outdoor"]; // TODO: detect weather, terrain,
  // gear tags; indoor detection from trainer-power covariance.

  // ── 5. Assemble result ────────────────────────────────────────────────

  return {
    id,
    sportType,
    startDateLocal,
    name,
    distanceMeters,
    movingTimeSeconds,
    elapsedTimeSeconds,
    totalElevationGain,
    avgSpeedKmh,
    avgPower,
    kJ,
    hasPowerData,
    hasHrData,
    powerDropoutSeconds,
    hrDropoutSeconds,
    unrealisticSpikes,
    z1_seconds: z1,
    z2_seconds: z2,
    z3_seconds: z3,
    z4_seconds: z4,
    z5_seconds: z5,
    z6_seconds: z6,
    z7_seconds: z7,
    sessionType,
    hardTags,
  };
}

// ─── Internal helpers ──────────────────────────────────────────────────────

/** Count seconds where the signal drops to zero or invalid. */
function countDropouts(data: number[]): number {
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (v == null || v <= 0 || !isFinite(v)) count++;
  }
  return count;
}

/**
 * Count data points that appear to be sensor spikes rather than real effort.
 *
 * TODO: replace simple threshold with a rolling-median filter so that short
 *       max-effort bursts (e.g. sprint peaks > 2000 W) are not falsely
 *       flagged.
 */
function countUnrealisticSpikes(watts: number[], avgPower: number | null): number {
  if (watts.length === 0) return 0;

  // Absolute ceiling — nobody sustains >2000 W real power
  const ABSOLUTE_CEILING = 2000;

  // Relative ceiling — a point exceeding 3× the ride average is suspect
  // unless it is an isolated sprint data point.
  const RELATIVE_FACTOR = 3;
  const cap = avgPower != null && avgPower > 0 ? avgPower * RELATIVE_FACTOR : Infinity;

  let count = 0;
  for (let i = 0; i < watts.length; i++) {
    const w = watts[i];
    if (w == null || !isFinite(w)) continue;
    if (w > ABSOLUTE_CEILING && w > cap) count++;
  }
  return count;
}
