import type { StravaActivity } from "../strava/client.js";

// ============================================================================
// TYPES
// ============================================================================

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
  movingTime: number;    // seconds
  elapsedTime: number;
  distance: number;      // meters
  elevationGain: number;
  avgSpeedKmh: number;

  // Power
  avgPower?: number;
  maxPower?: number;
  np?: number;           // Normalized Power (30s rolling)
  if_?: number;          // Intensity Factor = NP / FTP
  tss?: number;          // Training Stress Score
  kJ?: number;

  // Heart rate
  avgHr?: number;
  maxHr?: number;

  // Zone seconds
  powerZoneSeconds: ZoneDistribution;

  // Pacing
  firstHalfAvgPower?: number;
  secondHalfAvgPower?: number;
  fadePercent?: number;  // positive means faded
  vi?: number;           // Variability Index = NP / AvgPower
  surgeCount?: number;

  // Intervals
  intervalCount: number;
  intervalDetails: string; // human-readable e.g. "3×10min Z4, 2×5min Z5"

  // Classification
  sessionType: string;   // Endurance / Sweet Spot / Threshold / VO2Max / Anaerobic / Recovery / Race / Mixed
  intensityBand: "Low" | "Moderate" | "High" | "Very High";
  gpsDifficultyBand: "short-easy" | "medium" | "long-hard";

  // RPE (1-10, rider-submitted after ride)
  rpe?: number;

  // Structure
  rideBreakup: string;   // computed from power stream

  // Hard tags
  hardTags: string[];

  // Data quality
  dataQuality: DataQualityFlags;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ZONE_LABELS = [
  "Z1(Recovery)", "Z2(Endurance)", "Z3(Tempo)", "Z4(SweetSpot)",
  "Z5(Threshold)", "Z6(VO2Max)", "Z7(Anaerobic)",
];

const ZONE_BOUNDARIES = [
  { zone: 1, min: 0, max: 0.55 },
  { zone: 2, min: 0.56, max: 0.75 },
  { zone: 3, min: 0.76, max: 0.87 },
  { zone: 4, min: 0.88, max: 0.94 },
  { zone: 5, min: 0.95, max: 1.05 },
  { zone: 6, min: 1.06, max: 1.20 },
  { zone: 7, min: 1.21, max: Infinity },
];

// ============================================================================
// HELPERS
// ============================================================================

function classifyZone(ratio: number): number {
  if (ratio <= 0.55) return 1;
  if (ratio <= 0.75) return 2;
  if (ratio <= 0.87) return 3;
  if (ratio <= 0.94) return 4;
  if (ratio <= 1.05) return 5;
  if (ratio <= 1.20) return 6;
  return 7;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

// ============================================================================
// POWER ZONES
// ============================================================================

export function computeTimeInZones(powerStream: number[] | undefined, ftp: number): ZoneDistribution {
  const zones: ZoneDistribution = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, z6: 0, z7: 0 };
  if (!powerStream || powerStream.length === 0 || !ftp) return zones;
  for (const watts of powerStream) {
    const ratio = watts / ftp;
    if (ratio <= 0.55) zones.z1++;
    else if (ratio <= 0.75) zones.z2++;
    else if (ratio <= 0.87) zones.z3++;
    else if (ratio <= 0.94) zones.z4++;
    else if (ratio <= 1.05) zones.z5++;
    else if (ratio <= 1.20) zones.z6++;
    else zones.z7++;
  }
  return zones;
}

// ============================================================================
// NORMALIZED POWER (NP)
// ============================================================================

export function computeNormalizedPower(powerStream: number[] | undefined): number | undefined {
  if (!powerStream || powerStream.length < 30) return undefined;
  // 30-second rolling average
  const smoothed: number[] = [];
  for (let i = 0; i <= powerStream.length - 30; i++) {
    let sum = 0;
    for (let j = 0; j < 30; j++) sum += powerStream[i + j];
    smoothed.push(sum / 30);
  }
  if (smoothed.length === 0) return undefined;
  // 4th power average → 4th root
  let sum4 = 0;
  for (const v of smoothed) sum4 += v ** 4;
  return Math.round(Math.pow(sum4 / smoothed.length, 0.25));
}

// ============================================================================
// INTENSITY FACTOR (IF) & TRAINING STRESS SCORE (TSS)
// ============================================================================

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

// ============================================================================
// VARIABILITY INDEX (VI = NP / AvgPower)
// ============================================================================

export function computeVariabilityIndex(np: number | undefined, avgPower: number | undefined): number | undefined {
  if (np === undefined || avgPower === undefined || avgPower <= 0) return undefined;
  return round1(np / avgPower);
}

// ============================================================================
// PACING — FADE & SURGE COUNT
// ============================================================================

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
  // Surges: power > 120% FTP for >= 5s after being below 90% FTP for >= 10s
  let surgeCount = 0;
  let belowDuration = 0;
  let inSurge = false;
  let surgeDuration = 0;
  // Use a rough threshold of 1.2x the average power as a proxy (no FTP access here)
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

// ============================================================================
// RIDE BREAKUP — human-readable structure from power stream
// ============================================================================

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

// ============================================================================
// INTERVAL DETECTION
// ============================================================================

export function detectIntervals(powerStream: number[] | undefined, ftp: number): {
  intervalCount: number;
  intervalDetails: string;
} {
  if (!powerStream || powerStream.length < 120 || !ftp) return { intervalCount: 0, intervalDetails: "" };
  // Use 30-second smoothed buckets
  const bucketSec = 30;
  const buckets: number[] = [];
  for (let i = 0; i < powerStream.length; i += bucketSec) {
    const slice = powerStream.slice(i, Math.min(i + bucketSec, powerStream.length));
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    buckets.push(avg);
  }
  // Work threshold: bucket avg power > 88% FTP (Z4+)
  const workThreshold = 0.88;
  const zones = buckets.map(w => w / ftp);
  // Find work blocks (minimum 2 consecutive buckets = 1 min)
  const blocks: { zone: number; duration: number }[] = [];
  let currentZone = 0;
  let currentCount = 0;
  for (const ratio of zones) {
    const z = ratio >= workThreshold ? Math.ceil(ratio / 0.1 + 2) : 0;
    // Normalize to Z1-Z7
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
  // Group by zone
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

// ============================================================================
// SESSION CLASSIFICATION
// ============================================================================

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

// ============================================================================
// GPS DIFFICULTY BAND — for rides without power/HR data
// ============================================================================

export function computeGpsDifficultyBand(movingTime: number, elevationGain: number): "short-easy" | "medium" | "long-hard" {
  const hours = movingTime / 3600;
  if (hours > 2 && elevationGain > 800) return "long-hard";
  if (hours > 1.5 || elevationGain > 500) return "medium";
  return "short-easy";
}

// ============================================================================
// HARD TAGS
// ============================================================================

function getHourUtc(isoDate: string): number {
  try { return parseInt(isoDate.slice(11, 13), 10); } catch { return 12; }
}

export function generateHardTags(
  parsed: Pick<ParsedRide, "powerZoneSeconds" | "np" | "avgPower" | "avgHr" | "elevationGain" | "distance" | "sessionType" | "intervalCount" | "dataQuality" | "sportType" | "avgSpeedKmh" | "vi" | "movingTime" | "startDate">,
): string[] {
  const tags: string[] = [];
  tags.push(parsed.sessionType.toLowerCase());

  // Indoor vs outdoor (heuristic: no elevation and short distance → indoor)
  if (parsed.elevationGain === 0 && parsed.distance < 20000) tags.push("indoor");
  else tags.push("outdoor");

  // Terrain
  const gainPerKm = parsed.distance > 0 ? (parsed.elevationGain / (parsed.distance / 1000)) : 0;
  if (gainPerKm > 50) tags.push("climbing");
  else if (gainPerKm > 20) tags.push("hilly");
  else if (gainPerKm > 5) tags.push("rolling");
  else tags.push("flat");

  // Intervals
  if (parsed.intervalCount > 0) tags.push("intervals");
  if (parsed.intervalCount > 5) tags.push("high-intensity");

  // Power data
  if (parsed.np && parsed.avgPower && parsed.vi && parsed.vi > 1.15) tags.push("variable-pacing");
  if (parsed.np && parsed.avgPower && parsed.vi && parsed.vi < 1.05) tags.push("steady-pacing");

  // Speed
  if (parsed.avgSpeedKmh > 35) tags.push("fast");
  if (parsed.avgSpeedKmh < 20 && parsed.elevationGain > 0) tags.push("slow");

  // Race
  if (parsed.sessionType === "Race") tags.push("race");

  // GPS-based structural tags (work even without power/HR)
  const distKm = parsed.distance / 1000;
  const movingHours = parsed.movingTime / 3600;

  if (distKm < 20 && parsed.elevationGain < 100) tags.push("commute");
  if (distKm > 80) tags.push("long-ride");
  if (movingHours > 2) tags.push("long-ride");
  if (movingHours > 4) tags.push("epic");

  // Time of day
  const hour = getHourUtc(parsed.startDate);
  if (hour >= 5 && hour < 9) tags.push("morning-ride");
  else if (hour >= 17 && hour < 21) tags.push("evening-ride");

  return tags;
}

// ============================================================================
// DATA QUALITY
// ============================================================================

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

// ============================================================================
// MAIN PARSE FUNCTION
// ============================================================================

export interface Streams {
  watts?: number[];
  heartrate?: number[];
  cadence?: number[];
  speed?: number[];
  altitude?: number[];
  time?: number[];
  distance?: number[];
}

export function parseRide(activity: StravaActivity, streams: Streams, ftp: number, rpe?: number): ParsedRide {
  const movingHours = activity.moving_time / 3600;
  const avgSpeedKmh = movingHours > 0 ? round1((activity.distance / 1000) / movingHours) : 0;

  // Power zones
  const powerZoneSeconds = computeTimeInZones(streams.watts, ftp);

  // NP, IF, TSS
  const np = computeNormalizedPower(streams.watts);
  const if_ = computeIntensityFactor(np, ftp);
  const tss = computeTrainingStressScore(activity.moving_time, np, if_, ftp);

  // Pacing
  const pacing = computePacingStats(streams.watts);
  const vi = computeVariabilityIndex(np, activity.average_watts ?? undefined);

  // Ride breakup
  const rideBreakup = computeRideBreakup(streams.watts, ftp);

  // Intervals
  const intervals = detectIntervals(streams.watts, ftp);

  // Classification
  const session = classifySession(powerZoneSeconds, np, ftp, intervals.intervalCount > 0);

  // Data quality
  const dataQuality = assessDataQuality(streams.watts, streams.heartrate, streams.cadence, streams.speed);

  // Build parsed ride
  const parsed: ParsedRide = {
    id: activity.id,
    name: activity.name,
    sportType: activity.sport_type,
    startDate: activity.start_date_local,
    movingTime: activity.moving_time,
    elapsedTime: activity.elapsed_time,
    distance: activity.distance,
    elevationGain: activity.total_elevation_gain ?? 0,
    avgSpeedKmh,
    avgPower: activity.average_watts ?? undefined,
    maxPower: activity.max_watts ?? undefined,
    np,
    if_,
    tss,
    kJ: activity.kilojoules ?? undefined,
    avgHr: activity.average_heartrate ?? undefined,
    maxHr: activity.max_heartrate ?? undefined,
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
    gpsDifficultyBand: computeGpsDifficultyBand(activity.moving_time, activity.total_elevation_gain ?? 0),
    rpe,
    rideBreakup,
    hardTags: [],
    dataQuality,
  };

  parsed.hardTags = generateHardTags(parsed);
  return parsed;
}
