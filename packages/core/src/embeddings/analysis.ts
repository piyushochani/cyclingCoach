import type { StravaActivity } from "../strava/client.js";
import type { LLM } from "../llm.js";

// ============================================================================
// TYPES
// ============================================================================

export interface ZoneDistribution {
  z1: number; // Active Recovery  (< 55% FTP) — seconds
  z2: number; // Endurance        (56-75% FTP)
  z3: number; // Tempo            (76-87% FTP)
  z4: number; // Sweet Spot       (88-94% FTP)
  z5: number; // Threshold        (95-105% FTP)
  z6: number; // VO2max           (106-120% FTP)
  z7: number; // Anaerobic        (> 120% FTP)
}

export interface ActivityAnalysis {
  rideType: string;
  rideBreakup: string;
  timeInZones: ZoneDistribution & { totalSeconds: number };
  overallIntensity: "Low" | "Moderate" | "High" | "Very High";
  couldBeBetter: string;
  dietRecommendation: string;
  reviewSummary: string;
  tags: string[];
}

const ZONE_BOUNDARIES = [
  { zone: 1, min: 0, max: 0.55 },
  { zone: 2, min: 0.56, max: 0.75 },
  { zone: 3, min: 0.76, max: 0.87 },
  { zone: 4, min: 0.88, max: 0.94 },
  { zone: 5, min: 0.95, max: 1.05 },
  { zone: 6, min: 1.06, max: 1.20 },
  { zone: 7, min: 1.21, max: Infinity },
];

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

function formatZoneSummary(zones: ZoneDistribution): string {
  const total = Object.values(zones).reduce((a, b) => a + b, 0);
  const pct = (s: number) => total > 0 ? ((s / total) * 100).toFixed(1) : "0.0";
  return [
    `Z1(Active Recovery): ${Math.round(zones.z1 / 60)}min (${pct(zones.z1)}%)`,
    `Z2(Endurance): ${Math.round(zones.z2 / 60)}min (${pct(zones.z2)}%)`,
    `Z3(Tempo): ${Math.round(zones.z3 / 60)}min (${pct(zones.z3)}%)`,
    `Z4(Sweet Spot): ${Math.round(zones.z4 / 60)}min (${pct(zones.z4)}%)`,
    `Z5(Threshold): ${Math.round(zones.z5 / 60)}min (${pct(zones.z5)}%)`,
    `Z6(VO2max): ${Math.round(zones.z6 / 60)}min (${pct(zones.z6)}%)`,
    `Z7(Anaerobic): ${Math.round(zones.z7 / 60)}min (${pct(zones.z7)}%)`,
  ].join("\n");
}

function formatLapsSummary(activity: StravaActivity): string {
  if (!activity.laps || activity.laps.length === 0) return "No lap data available.";
  return activity.laps.map((lap, i) => {
    const distKm = (lap.distance / 1000).toFixed(1);
    const dur = Math.round(lap.moving_time / 60);
    const watts = lap.average_watts ? `${Math.round(lap.average_watts)}W` : "N/A";
    const hr = lap.average_heartrate ? `${Math.round(lap.average_heartrate)}bpm` : "N/A";
    return `  Lap ${i + 1}: ${dur}min, ${distKm}km, ${watts}, ${hr}`;
  }).join("\n");
}

const ANALYSIS_PROMPT = `You are a professional cycling coach. Analyze this ride and return ONLY valid JSON with these fields:
- rideType: one of ["Recovery", "Endurance", "Tempo", "Sweet Spot", "Threshold", "VO2Max", "Anaerobic", "Mixed", "Race", "Commute"]
- rideBreakup: natural language description of session structure (e.g. "25min Z2 warm up → 3×10min Z4 intervals with 5min rest → 10min Z2 cool down")
- timeInZones: { z1_min, z2_min, z3_min, z4_min, z5_min, z6_min, z7_min } minutes in each power zone
- overallIntensity: "Low" | "Moderate" | "High" | "Very High"
- couldBeBetter: specific actionable feedback on pacing, technique, or strategy
- dietRecommendation: specific post-ride nutrition suggestion in grams
- reviewSummary: 2-3 sentence natural language review of the session
- tags: array of relevant tags like ["endurance", "group-ride", "hilly"]

Activity Data:
`;
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("429") || msg.includes("quota") || msg.includes("rate") || msg.includes("RESOURCE_EXHAUSTED");
}

// ============================================================================
// RIDE BREAKUP — build a human-readable structure description from power stream
// ============================================================================

const ZONE_LABELS = ["Z1(Recovery)", "Z2(Endurance)", "Z3(Tempo)", "Z4(SweetSpot)", "Z5(Threshold)", "Z6(VO2Max)", "Z7(Anaerobic)"];

function classifyZone(ratio: number): number {
  if (ratio <= 0.55) return 1;
  if (ratio <= 0.75) return 2;
  if (ratio <= 0.87) return 3;
  if (ratio <= 0.94) return 4;
  if (ratio <= 1.05) return 5;
  if (ratio <= 1.20) return 6;
  return 7;
}

export function computeRideBreakup(powerStream: number[] | undefined, ftp: number): string {
  if (!powerStream || powerStream.length < 60 || !ftp) return "";
  // Downsample to 30-second buckets (average power in each window)
  const bucketSec = 30;
  const buckets: number[] = [];
  for (let i = 0; i < powerStream.length; i += bucketSec) {
    const slice = powerStream.slice(i, Math.min(i + bucketSec, powerStream.length));
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    buckets.push(avg);
  }
  // Map each bucket to a zone
  const zoneBuckets = buckets.map(w => classifyZone(w / ftp));
  // Group consecutive same-zone buckets
  const rawSegments: { zone: number; count: number }[] = [];
  for (const z of zoneBuckets) {
    if (rawSegments.length > 0 && rawSegments[rawSegments.length - 1].zone === z) {
      rawSegments[rawSegments.length - 1].count++;
    } else {
      rawSegments.push({ zone: z, count: 1 });
    }
  }
  // Merge segments < 2 buckets into the previous one (smoothing)
  const merged: { zone: number; count: number }[] = [];
  for (const seg of rawSegments) {
    if (seg.count < 2 && merged.length > 0) {
      merged[merged.length - 1].count += seg.count;
    } else {
      merged.push(seg);
    }
  }
  // Build readable description
  const parts = merged.map(seg => {
    const mins = Math.round(seg.count * bucketSec / 60);
    return `${mins}min ${ZONE_LABELS[seg.zone - 1]}`;
  });
  return parts.join(" → ");
}

export async function analyzeActivity(
  llm: LLM,
  activity: StravaActivity,
  zones: ZoneDistribution,
  ftp: number,
  powerStream?: number[],
): Promise<ActivityAnalysis> {
  const zoneSummary = formatZoneSummary(zones);
  const lapSummary = formatLapsSummary(activity);
  const durationMin = Math.round(activity.moving_time / 60);
  const distKm = (activity.distance / 1000).toFixed(1);

  const prompt = ANALYSIS_PROMPT + [
    `Name: ${activity.name}`,
    `Date: ${activity.start_date_local}`,
    `Type: ${activity.sport_type}`,
    `Duration: ${durationMin} minutes`,
    `Distance: ${distKm} km`,
    `Elevation: ${Math.round(activity.total_elevation_gain ?? 0)}m`,
    `Avg Power: ${activity.average_watts ? Math.round(activity.average_watts) + "W" : "N/A"}`,
    `Max Power: ${activity.max_watts ? Math.round(activity.max_watts) + "W" : "N/A"}`,
    `Weighted Avg Power: ${activity.weighted_average_watts ? Math.round(activity.weighted_average_watts) + "W" : "N/A"}`,
    `Avg HR: ${activity.average_heartrate ? Math.round(activity.average_heartrate) + "bpm" : "N/A"}`,
    `Max HR: ${activity.max_heartrate ? Math.round(activity.max_heartrate) + "bpm" : "N/A"}`,
    `Avg Speed: ${activity.average_speed ? (activity.average_speed * 3.6).toFixed(1) + " km/h" : "N/A"}`,
    `Kilojoules: ${activity.kilojoules ? Math.round(activity.kilojoules) + "kJ" : "N/A"}`,
    `FTP: ${ftp}W`,
    ``,
    `Time in Power Zones:`,
    zoneSummary,
    ``,
    `Laps:`,
    lapSummary,
  ].join("\n");

  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { text } = await llm.generate({
        messages: [{ role: "user", content: prompt }],
      });

      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No JSON found in LLM response");
      }

      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as ActivityAnalysis;

      // Attach zone distribution in seconds
      parsed.timeInZones = {
        ...parsed.timeInZones,
        z1: zones.z1,
        z2: zones.z2,
        z3: zones.z3,
        z4: zones.z4,
        z5: zones.z5,
        z6: zones.z6,
        z7: zones.z7,
        totalSeconds: Object.values(zones).reduce((a, b) => a + b, 0),
      } as any;

      return parsed;
    } catch (err) {
      lastError = err;
      if (isRateLimitError(err) && attempt < maxRetries) {
        const backoff = Math.pow(2, attempt + 1) * 1000;
        console.warn(`LLM rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoff}ms...`);
        await delay(backoff);
      } else {
        break;
      }
    }
  }

  console.warn(`LLM analysis failed for activity ${activity.id}, using fallback:`, lastError);
  return fallbackAnalysis(activity, zones, ftp, powerStream);
}

function fallbackAnalysis(activity: StravaActivity, zones: ZoneDistribution, ftp: number, powerStream?: number[]): ActivityAnalysis {
  const totalSeconds = Object.values(zones).reduce((a, b) => a + b, 0);
  const z3plus = zones.z3 + zones.z4 + zones.z5 + zones.z6 + zones.z7;
  const z4plus = zones.z4 + zones.z5 + zones.z6 + zones.z7;
  const pctHard = totalSeconds > 0 ? (z4plus / totalSeconds) * 100 : 0;

  let rideType = "Endurance";
  if (pctHard > 40) rideType = "Sweet Spot";
  if (pctHard > 60) rideType = "Threshold";
  if (zones.z6 + zones.z7 > 300) rideType = "VO2Max";

  let intensity: "Low" | "Moderate" | "High" | "Very High" = "Low";
  if (pctHard > 20) intensity = "Moderate";
  if (pctHard > 40) intensity = "High";
  if (pctHard > 60) intensity = "Very High";

  const breakup = powerStream ? computeRideBreakup(powerStream, ftp) : "";
  const rideBreakup = breakup || `Ride with ${Math.round(z3plus / 60)}min above Z3. See zone distribution for details.`;

  return {
    rideType,
    rideBreakup,
    timeInZones: { ...zones, totalSeconds },
    overallIntensity: intensity,
    couldBeBetter: activity.average_watts
      ? "Consider reviewing power distribution for better pacing."
      : "No power data available for detailed analysis.",
    dietRecommendation: activity.kilojoules
      ? `Post-ride: ~${Math.round(activity.kilojoules * 0.06)}g protein + ${Math.round(activity.kilojoules * 0.08)}g carbs + electrolytes.`
      : "Post-ride: 30g protein + 60g carbs + electrolytes.",
    reviewSummary: `${activity.name}: ${(activity.distance / 1000).toFixed(1)}km in ${Math.round(activity.moving_time / 60)}min.${activity.average_watts ? ` Avg power ${Math.round(activity.average_watts)}W.` : ""}`,
    tags: [rideType.toLowerCase(), activity.sport_type.toLowerCase()],
  };
}
