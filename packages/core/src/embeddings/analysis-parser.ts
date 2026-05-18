/**
 * Pure deterministic parser for a single Strava cycling activity.
 *
 * Takes raw activity + streams + athlete profile and produces a structured
 * ParsedRide with computed metrics, zone times, pacing stats, interval
 * detection, session classification, and data-quality signals.
 *
 * This module contains NO LLM calls, NO side effects, and NO network I/O.
 */

import type { StravaActivity, AthleteProfile, Streams } from "../strava/client.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ZoneDistribution {
  z1: number; z2: number; z3: number; z4: number;
  z5: number; z6: number; z7: number;
}

export interface DataQualityFlags {
  hasPowerData: boolean;
  hasHrData: boolean;
  powerDropoutSeconds: number;
  hrDropoutSeconds: number;
  unrealisticSpikes: number;
  missingCadence: boolean;
  missingSpeed: boolean;
}

export interface ParsedRide {
  // Identity
  id: number;
  name: string;
  sportType: string;
  startDate: string;

  // Basic metrics
  movingTime: number;
  elapsedTime: number;
  distance: number;
  elevationGain: number;
  avgSpeedKmh: number;

  // Power / energy
  avgPower?: number;
  maxPower?: number;
  np?: number;
  if_?: number;
  tss?: number;
  kJ?: number;

  // Heart rate
  avgHr?: number;
  maxHr?: number;

  // Zone seconds (power, 7-zone Coggan)
  powerZoneSeconds: ZoneDistribution;

  // Pacing
  firstHalfAvgPower?: number;
  secondHalfAvgPower?: number;
  fadePercent?: number;
  vi?: number;
  surgeCount?: number;

  // Intervals
  intervalCount: number;
  intervalDetails: string;

  // Classification
  sessionType: string;
  intensityBand: "Low" | "Moderate" | "High" | "Very High";

  // Structure
  rideBreakup: string;

  // Tags
  hardTags: string[];

  // Data quality
  dataQuality: DataQualityFlags;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ZONE_LABELS = [
  "Z1(Recovery)", "Z2(Endurance)", "Z3(Tempo)", "Z4(SweetSpot)",
  "Z5(Threshold)", "Z6(VO2Max)", "Z7(Anaerobic)",
];

const POWER_ZONE_CAPS = [
  { zone: 1, maxFrac: 0.55 },
  { zone: 2, maxFrac: 0.75 },
  { zone: 3, maxFrac: 0.87 },
  { zone: 4, maxFrac: 1.00 },
  { zone: 5, maxFrac: 1.20 },
  { zone: 6, maxFrac: 1.50 },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

// ─── Power zones ────────────────────────────────────────────────────────────

export function computeTimeInZones(powerStream: number[] | undefined, ftp: number): ZoneDistribution {
  const zones: ZoneDistribution = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, z6: 0, z7: 0 };
  if (!powerStream || powerStream.length === 0 || !ftp) return zones;
  for (const watts of powerStream) {
    if (watts == null || watts <= 0 || !isFinite(watts)) continue;
    const ratio = watts / ftp;
    if (ratio <= 0.55) zones.z1++;
    else if (ratio <= 0.75) zones.z2++;
    else if (ratio <= 0.87) zones.z3++;
    else if (ratio <= 1.00) zones.z4++;
    else if (ratio <= 1.20) zones.z5++;
    else if (ratio <= 1.50) zones.z6++;
    else zones.z7++;
  }
  return zones;
}

// ─── Normalized Power (NP) ──────────────────────────────────────────────────

export function computeNormalizedPower(powerStream: number[] | undefined): number | undefined {
  if (!powerStream || powerStream.length < 30) return undefined;
  const smoothed: number[] = [];
  for (let i = 0; i <= powerStream.length - 30; i++) {
    let sum = 0;
    for (let j = 0; j < 30; j++) sum += powerStream[i + j];
    smoothed.push(sum / 30);
  }
  if (smoothed.length === 0) return undefined;
  let sum4 = 0;
  for (const v of smoothed) sum4 += v ** 4;
  return Math.round(Math.pow(sum4 / smoothed.length, 0.25));
}

// ─── Intensity Factor (IF) & Training Stress Score (TSS) ────────────────────

export function computeIntensityFactor(np: number | undefined, ftp: number): number | undefined {
  if (np === undefined || !ftp) return undefined;
  return round1(np / ftp);
}

export function computeTrainingStressScore(
  durationSec: number, np: number | undefined, if_: number | undefined, ftp: number,
): number | undefined {
  if (np === undefined || if_ === undefined || !ftp || durationSec <= 0) return undefined;
  return Math.round((durationSec * np * if_) / (ftp * 3600) * 100);
}

// ─── Variability Index (VI = NP / AvgPower) ─────────────────────────────────

export function computeVariabilityIndex(np: number | undefined, avgPower: number | undefined): number | undefined {
  if (np === undefined || avgPower === undefined || avgPower <= 0) return undefined;
  return round1(np / avgPower);
}

// ─── Pacing — fade & surge count ────────────────────────────────────────────

export function computePacingStats(powerStream: number[] | undefined): {
  firstHalfAvgPower?: number;
  secondHalfAvgPower?: number;
  fadePercent?: number;
  surgeCount?: number;
} {
  if (!powerStream || powerStream.length < 60) return {};
  const mid = Math.floor(powerStream.length / 2);
  const first = powerStream.slice(0, mid);
  const second = powerStream.slice(mid, powerStream.length - (powerStream.length % 2 === 0 ? 0 : 1));
  const avg1 = first.reduce((a, b) => a + b, 0) / first.length;
  const avg2 = second.reduce((a, b) => a + b, 0) / second.length;
  const fade = avg1 > 0 ? round1((avg1 - avg2) / avg1 * 100) : 0;

  let surgeCount = 0;
  let belowDuration = 0;
  let inSurge = false;
  let surgeDuration = 0;
  const threshold = avg1 * 1.2;
  for (const w of powerStream) {
    if (w < avg1 * 0.9) { belowDuration++; } else { belowDuration = 0; }
    if (!inSurge && belowDuration >= 10 && w > threshold) {
      inSurge = true;
      surgeDuration = 1;
    } else if (inSurge) {
      if (w > threshold) { surgeDuration++; } else {
        if (surgeDuration >= 5) surgeCount++;
        inSurge = false;
        surgeDuration = 0;
      }
    }
  }

  return { firstHalfAvgPower: Math.round(avg1), secondHalfAvgPower: Math.round(avg2), fadePercent: fade, surgeCount };
}

// ─── Ride breakup — human-readable structure from power stream ───────────────

export function computeRideBreakup(powerStream: number[] | undefined, ftp: number): string {
  if (!powerStream || powerStream.length < 60 || !ftp) return "";
  const bucketSec = 30;
  const buckets: number[] = [];
  for (let i = 0; i < powerStream.length; i += bucketSec) {
    const slice = powerStream.slice(i, Math.min(i + bucketSec, powerStream.length));
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    buckets.push(avg);
  }
  const zoneBuckets = buckets.map(w => classifyZone(w / ftp));
  const rawSegments: { zone: number; count: number }[] = [];
  for (const z of zoneBuckets) {
    if (rawSegments.length > 0 && rawSegments[rawSegments.length - 1].zone === z) {
      rawSegments[rawSegments.length - 1].count++;
    } else {
      rawSegments.push({ zone: z, count: 1 });
    }
  }
  const merged: { zone: number; count: number }[] = [];
  for (const seg of rawSegments) {
    if (seg.count < 2 && merged.length > 0) {
      merged[merged.length - 1].count += seg.count;
    } else {
      merged.push(seg);
    }
  }
  const parts = merged.map(seg => {
    const mins = Math.round(seg.count * bucketSec / 60);
    return `${mins}min ${ZONE_LABELS[seg.zone - 1]}`;
  });
  return parts.join(" → ");
}

// ─── Interval detection ─────────────────────────────────────────────────────

export function detectIntervals(powerStream: number[] | undefined, ftp: number): {
  intervalCount: number;
  intervalDetails: string;
} {
  if (!powerStream || powerStream.length < 120 || !ftp) return { intervalCount: 0, intervalDetails: "" };
  const bucketSec = 30;
  const buckets: number[] = [];
  for (let i = 0; i < powerStream.length; i += bucketSec) {
    const slice = powerStream.slice(i, Math.min(i + bucketSec, powerStream.length));
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    buckets.push(avg);
  }
  const workThreshold = 0.88;
  const blocks: { zone: number; duration: number }[] = [];
  let currentZone = 0;
  let currentCount = 0;
  for (const ratio of buckets.map(w => w / ftp)) {
    let effectiveZone = 0;
    if (ratio > 1.20) effectiveZone = 7;
    else if (ratio > 1.05) effectiveZone = 6;
    else if (ratio > 0.94) effectiveZone = 5;
    else if (ratio >= workThreshold) effectiveZone = 4;
    if (effectiveZone > 0) {
      if (currentZone === effectiveZone) { currentCount++; } else {
        if (currentZone > 0 && currentCount >= 2) blocks.push({ zone: currentZone, duration: currentCount * bucketSec });
        currentZone = effectiveZone;
        currentCount = 1;
      }
    } else {
      if (currentZone > 0 && currentCount >= 2) blocks.push({ zone: currentZone, duration: currentCount * bucketSec });
      currentZone = 0;
      currentCount = 0;
    }
  }
  if (currentZone > 0 && currentCount >= 2) blocks.push({ zone: currentZone, duration: currentCount * bucketSec });
  if (blocks.length === 0) return { intervalCount: 0, intervalDetails: "" };

  const byZone = new Map<number, number[]>();
  for (const b of blocks) {
    const arr = byZone.get(b.zone) || [];
    arr.push(Math.round(b.duration / 60));
    byZone.set(b.zone, arr);
  }
  const details = Array.from(byZone.entries())
    .sort(([a], [b]) => a - b)
    .map(([zone, durations]) => {
      const count = durations.length;
      const avgMin = Math.round(durations.reduce((a, b) => a + b, 0) / count);
      return `${count}×${avgMin}min ${ZONE_LABELS[zone - 1]}`;
    })
    .join(", ");
  return { intervalCount: blocks.length, intervalDetails: details };
}

export function classifyZone(ratio: number): number {
  if (ratio <= 0.55) return 1;
  if (ratio <= 0.75) return 2;
  if (ratio <= 0.87) return 3;
  if (ratio <= 1.00) return 4;
  if (ratio <= 1.20) return 5;
  if (ratio <= 1.50) return 6;
  return 7;
}

// ─── Session classification ─────────────────────────────────────────────────

export function classifySession(
  zoneSeconds: ZoneDistribution, np: number | undefined, ftp: number, hasIntervals: boolean,
): { sessionType: string; intensityBand: "Low" | "Moderate" | "High" | "Very High" } {
  const total = Object.values(zoneSeconds).reduce((a, b) => a + b, 0);
  const z4plus = zoneSeconds.z4 + zoneSeconds.z5 + zoneSeconds.z6 + zoneSeconds.z7;
  const z5plus = zoneSeconds.z5 + zoneSeconds.z6 + zoneSeconds.z7;
  const z6plus = zoneSeconds.z6 + zoneSeconds.z7;
  const pctHard = total > 0 ? (z4plus / total) * 100 : 0;
  const pctZ5plus = total > 0 ? (z5plus / total) * 100 : 0;
  const pctZ6plus = total > 0 ? (z6plus / total) * 100 : 0;

  let sessionType = "Endurance";
  if (pctZ6plus > 5 || zoneSeconds.z7 > 60) sessionType = "VO2Max";
  else if (hasIntervals && pctZ5plus > 15) sessionType = "Threshold";
  else if (pctHard > 50) sessionType = "Sweet Spot";
  else if (pctHard > 25) sessionType = "Tempo";
  else if (np !== undefined && ftp > 0 && np / ftp > 1.05) sessionType = "Race";
  else if (total > 0 && z4plus === 0 && zoneSeconds.z1 + zoneSeconds.z2 > 0.8 * total) sessionType = "Recovery";

  let intensityBand: "Low" | "Moderate" | "High" | "Very High" = "Low";
  if (pctHard > 20) intensityBand = "Moderate";
  if (pctHard > 40) intensityBand = "High";
  if (pctHard > 60) intensityBand = "Very High";
  if (np !== undefined && ftp > 0) {
    const if_ = np / ftp;
    if (if_ > 0.85) intensityBand = "Very High";
    else if (if_ > 0.75) intensityBand = "High";
    else if (if_ > 0.65) intensityBand = "Moderate";
  }

  return { sessionType, intensityBand };
}

// ─── Hard tags ──────────────────────────────────────────────────────────────

export function generateHardTags(
  parsed: Pick<ParsedRide, "powerZoneSeconds" | "np" | "avgPower" | "avgHr" | "elevationGain" | "distance" | "sessionType" | "intervalCount" | "dataQuality" | "sportType" | "avgSpeedKmh" | "vi">,
): string[] {
  const tags: string[] = [];
  tags.push(parsed.sessionType.toLowerCase());

  if (parsed.elevationGain === 0 && parsed.distance < 20000) tags.push("indoor");
  else tags.push("outdoor");

  const gainPerKm = parsed.distance > 0 ? (parsed.elevationGain / (parsed.distance / 1000)) : 0;
  if (gainPerKm > 50) tags.push("climbing");
  else if (gainPerKm > 20) tags.push("hilly");
  else if (gainPerKm > 5) tags.push("rolling");
  else tags.push("flat");

  if (parsed.intervalCount > 0) tags.push("intervals");
  if (parsed.intervalCount > 5) tags.push("high-intensity");

  if (parsed.np && parsed.avgPower && parsed.vi && parsed.vi > 1.15) tags.push("variable-pacing");
  if (parsed.np && parsed.avgPower && parsed.vi && parsed.vi < 1.05) tags.push("steady-pacing");

  if (parsed.avgSpeedKmh > 35) tags.push("fast");
  if (parsed.avgSpeedKmh < 20 && parsed.elevationGain > 0) tags.push("slow");

  if (parsed.sessionType === "Race") tags.push("race");

  return tags;
}

// ─── Data quality ───────────────────────────────────────────────────────────

export function assessDataQuality(
  powerStream: number[] | undefined,
  hrStream: number[] | undefined,
  cadenceStream: number[] | undefined,
  speedStream: number[] | undefined,
): DataQualityFlags {
  const hasPowerData = !!powerStream && powerStream.length > 0;
  const hasHrData = !!hrStream && hrStream.length > 0;
  const flags: DataQualityFlags = {
    hasPowerData,
    hasHrData,
    powerDropoutSeconds: 0,
    hrDropoutSeconds: 0,
    unrealisticSpikes: 0,
    missingCadence: !cadenceStream || cadenceStream.length === 0,
    missingSpeed: !speedStream || speedStream.length === 0,
  };
  if (hasPowerData && powerStream) {
    let dropout = 0;
    let spikes = 0;
    for (let i = 1; i < powerStream.length; i++) {
      if (powerStream[i] === 0 && powerStream[i - 1] > 0) dropout++;
      if (powerStream[i] > powerStream[i - 1] * 3 && powerStream[i] > 1500) spikes++;
    }
    flags.powerDropoutSeconds = dropout;
    flags.unrealisticSpikes = spikes;
  }
  if (hasHrData && hrStream) {
    let dropout = 0;
    for (let i = 1; i < hrStream.length; i++) {
      if (hrStream[i] === 0 && hrStream[i - 1] > 0) dropout++;
    }
    flags.hrDropoutSeconds = dropout;
  }
  return flags;
}

// ─── Main parse function ────────────────────────────────────────────────────

/**
 * Produce a structured ParsedRide from raw activity, streams, and athlete
 * profile — all available before any LLM call.
 *
 * The function is:
 *   - **Deterministic** — same inputs always produce the same result.
 *   - **Side-effect free** — no I/O, no logging, no global state.
 *
 * TODO: Add HR zone time once maxHeartRate is reliably available in the
 *       athlete profile.
 * TODO: Detect standing / seated segments from cadence-power ratio.
 * TODO: Surface per-kilometer splits.
 * TODO: Add weather / surface / gear heuristics for hardTags.
 */
export function parseStravaActivity(
  rawActivity: StravaActivity,
  streams: Streams,
  profile: AthleteProfile,
): ParsedRide {
  const ftp = profile.ftp ?? 250;

  const movingTime = rawActivity.moving_time;
  const elapsedTime = rawActivity.elapsed_time;
  const distance = rawActivity.distance;
  const elevationGain = rawActivity.total_elevation_gain ?? 0;
  const avgSpeedKmh = movingTime > 0 ? (distance / movingTime) * 3.6 : 0;

  const avgPower = rawActivity.average_watts ?? undefined;
  const maxPower = rawActivity.max_watts ?? undefined;
  const kJ = rawActivity.kilojoules ?? undefined;
  const avgHr = rawActivity.average_heartrate ?? undefined;
  const maxHr = rawActivity.max_heartrate ?? undefined;

  // Power zones
  const powerZoneSeconds = computeTimeInZones(streams.watts, ftp);

  // NP, IF, TSS
  const np = computeNormalizedPower(streams.watts);
  const if_ = computeIntensityFactor(np, ftp);
  const tss = computeTrainingStressScore(movingTime, np, if_, ftp);

  // Pacing
  const pacing = computePacingStats(streams.watts);
  const vi = computeVariabilityIndex(np, avgPower);

  // Ride breakup
  const rideBreakup = computeRideBreakup(streams.watts, ftp);

  // Intervals
  const intervals = detectIntervals(streams.watts, ftp);

  // Classification
  const session = classifySession(powerZoneSeconds, np, ftp, intervals.intervalCount > 0);

  // Data quality
  const dataQuality = assessDataQuality(streams.watts, streams.heartrate, streams.cadence, streams.speed);

  const parsed: ParsedRide = {
    id: rawActivity.id,
    name: rawActivity.name,
    sportType: rawActivity.sport_type,
    startDate: rawActivity.start_date_local,
    movingTime,
    elapsedTime,
    distance,
    elevationGain,
    avgSpeedKmh,
    avgPower,
    maxPower,
    np,
    if_,
    tss,
    kJ,
    avgHr,
    maxHr,
    powerZoneSeconds,
    firstHalfAvgPower: pacing.firstHalfAvgPower,
    secondHalfAvgPower: pacing.secondHalfAvgPower,
    fadePercent: pacing.fadePercent,
    vi,
    surgeCount: pacing.surgeCount,
    intervalCount: intervals.intervalCount,
    intervalDetails: intervals.intervalDetails,
    sessionType: session.sessionType,
    intensityBand: session.intensityBand,
    rideBreakup,
    hardTags: [],
    dataQuality,
  };

  parsed.hardTags = generateHardTags(parsed);
  return parsed;
}
