import type { LLM } from "../llm.js";
import type { ParsedRide } from "./analysis-parser.js";

// ============================================================================
// TYPES
// ============================================================================

export interface ActivityAnalysis {
  sessionTitle: string;
  coachSummary: string;
  loadNotes: string;
  pacingNotes: string;
  softTags: string[];
}

// ============================================================================
// LLM PROMPT
// ============================================================================

function buildPrompt(ride: ParsedRide): string {
  const isDataPoor = !ride.dataQuality.hasPowerData && !ride.dataQuality.hasHrData && ride.rpe === undefined;

  const lines: string[] = [
    `You are a professional cycling coach analyzing a ride. Return ONLY valid JSON with these fields:`,
    `- sessionTitle: a short human-friendly title (e.g. "2×20 min sweet-spot with strong finish")`,
    `- coachSummary: 3-6 sentence natural language summary describing focus, effort level, and main takeaways`,
    `- loadNotes: 1-2 sentences translating the numeric load into human language`,
    `- pacingNotes: 1-2 sentences interpreting the pacing stats`,
    `- softTags: array of qualitative tags like ["good-pacing", "fatigued", "breakthrough"]`,
    ``,
  ];

  // Data-poor ride instructions
  if (isDataPoor) {
    lines.push(
      `NOTE: This ride has NO power data, NO heart rate data, and NO rider effort rating (RPE).`,
      `Do NOT state how hard it was as a fact. Instead, describe what kind of ride it was based on`,
      `GPS-available characteristics (duration, distance, elevation, speed). You may mention once that`,
      `"Without HR or power data, only basic characteristics like duration and elevation are known."`,
      `Focus the summary on ride type (long, hilly, commute, etc.), not intensity.`,
    );
    if (ride.rpe !== undefined) {
      lines.push(
        `The rider rated this effort ${ride.rpe}/10. You CAN reference this as a subjective effort indicator.`,
      );
    }
  }

  lines.push(
    ``,
    `Ride Data:`,
    `---`,
    `Name: ${ride.name}`,
    `Date: ${ride.startDate}`,
    `Type: ${ride.sportType}`,
    `Duration: ${Math.round(ride.movingTime / 60)} min (elapsed ${Math.round(ride.elapsedTime / 60)} min)`,
    `Distance: ${(ride.distance / 1000).toFixed(1)} km at ${ride.avgSpeedKmh} km/h`,
    `Elevation: ${ride.elevationGain} m`,
    `GPS difficulty band: ${ride.gpsDifficultyBand}`,
    `Session type: ${ride.sessionType}`,
    `Intensity band: ${ride.intensityBand}`,
  );

  if (ride.avgPower !== undefined) lines.push(`Avg power: ${ride.avgPower} W`);
  if (ride.maxPower !== undefined) lines.push(`Max power: ${ride.maxPower} W`);
  if (ride.np !== undefined) lines.push(`Normalized Power (NP): ${ride.np} W`);
  if (ride.if_ !== undefined) lines.push(`Intensity Factor (IF): ${ride.if_}`);
  if (ride.tss !== undefined) lines.push(`Training Stress Score (TSS): ${ride.tss}`);
  if (ride.kJ !== undefined) lines.push(`Energy: ${ride.kJ} kJ`);
  if (ride.avgHr !== undefined) lines.push(`Avg HR: ${ride.avgHr} bpm`);
  if (ride.maxHr !== undefined) lines.push(`Max HR: ${ride.maxHr} bpm`);

  const zTotal = Object.values(ride.powerZoneSeconds).reduce((a, b) => a + b, 0);
  if (zTotal > 0) {
    const pct = (s: number) => ((s / zTotal) * 100).toFixed(1);
    lines.push(`Power zones: Z1 ${pct(ride.powerZoneSeconds.z1)}%, Z2 ${pct(ride.powerZoneSeconds.z2)}%, Z3 ${pct(ride.powerZoneSeconds.z3)}%, Z4 ${pct(ride.powerZoneSeconds.z4)}%, Z5 ${pct(ride.powerZoneSeconds.z5)}%, Z6 ${pct(ride.powerZoneSeconds.z6)}%, Z7 ${pct(ride.powerZoneSeconds.z7)}%`);
  }

  if (ride.rideBreakup) lines.push(`Ride structure: ${ride.rideBreakup}`);
  if (ride.firstHalfAvgPower !== undefined) lines.push(`First half avg power: ${ride.firstHalfAvgPower} W`);
  if (ride.secondHalfAvgPower !== undefined) lines.push(`Second half avg power: ${ride.secondHalfAvgPower} W`);
  if (ride.fadePercent !== undefined) lines.push(`Power fade: ${ride.fadePercent}%`);
  if (ride.vi !== undefined) lines.push(`Variability Index (VI): ${ride.vi}`);
  if (ride.surgeCount !== undefined) lines.push(`Surges: ${ride.surgeCount}`);
  if (ride.intervalCount > 0) lines.push(`Intervals: ${ride.intervalDetails}`);
  if (ride.hardTags.length > 0) lines.push(`Tags: ${ride.hardTags.join(", ")}`);

  return lines.join("\n");
}

function buildFallbackText(ride: ParsedRide): ActivityAnalysis {
  const isDataPoor = !ride.dataQuality.hasPowerData && !ride.dataQuality.hasHrData && ride.rpe === undefined;

  let coachSummary: string;
  if (isDataPoor) {
    const distKm = (ride.distance / 1000).toFixed(1);
    const durMin = Math.round(ride.movingTime / 60);
    coachSummary = `${ride.name}: ${distKm} km in ${durMin} min. GPS-based classification: ${ride.gpsDifficultyBand}. Without HR or power data, only basic characteristics like duration and elevation are known for this ride.`;
  } else {
    coachSummary = `${ride.name}: ${(ride.distance / 1000).toFixed(1)} km in ${Math.round(ride.movingTime / 60)} min. ${ride.sessionType} session at ${ride.intensityBand} intensity.${ride.avgPower ? ` Avg power ${ride.avgPower} W.` : ""}${ride.rideBreakup ? ` Structure: ${ride.rideBreakup}.` : ""}`;
  }

  let loadNotes: string;
  if (ride.rpe !== undefined) {
    loadNotes = `Rider rated this a ${ride.rpe}/10 effort subjectively.`;
  } else if (ride.tss !== undefined) {
    loadNotes = `TSS of ${ride.tss} indicates a ${ride.tss < 100 ? "moderate" : ride.tss < 150 ? "hard" : "very demanding"} session.`;
  } else {
    loadNotes = "Without HR or power data, precise load estimation is not available.";
  }

  let pacingNotes: string;
  if (ride.fadePercent !== undefined && ride.fadePercent > 5) {
    pacingNotes = `Power faded ${ride.fadePercent}% from first to second half. Consider more even pacing.`;
  } else if (ride.fadePercent !== undefined) {
    pacingNotes = `Pacing was steady with only ${ride.fadePercent}% fade.`;
  } else {
    pacingNotes = "Insufficient data for pacing analysis.";
  }

  return {
    sessionTitle: ride.sessionType,
    coachSummary,
    loadNotes,
    pacingNotes,
    softTags: [ride.sessionType.toLowerCase()],
  };
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("429") || msg.includes("503") || msg.includes("quota") || msg.includes("rate") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("UNAVAILABLE") || msg.includes("high demand");
}

export async function analyzeActivity(llm: LLM, ride: ParsedRide): Promise<ActivityAnalysis> {
  const prompt = buildPrompt(ride);
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

  console.warn(`LLM analysis failed for activity ${ride.id}, using fallback:`, lastError);
  return buildFallbackText(ride);
}
