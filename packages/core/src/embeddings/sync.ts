import { StravaClient, type StravaActivity, type StravaAthlete } from "../strava/client.js";
import { EmbeddingService } from "./service.js";
import { PineconeClient } from "./pinecone.js";
import { ActivityTracker } from "./activity-tracker.js";
import { analyzeActivity, type ActivityAnalysis } from "./analysis.js";
import { parseRide, type ParsedRide } from "./analysis-parser.js";
import { LLM } from "../llm.js";
import type { Config } from "../config.js";
import type { ActivityChunk, AthleteProfile } from "../reference/schemas/strava.js";

export interface EnrichedActivityMetadata {
  kind: "activity";

  // Identity
  id: number;
  name: string;
  sportType: string;
  startDateLocal: string;

  // Basic
  elapsedTime: number;
  movingTime: number;
  distance: number;
  totalElevationGain: number;
  avgSpeedKmh: number;

  // Power
  avgPower?: number;
  maxPower?: number;
  np?: number;
  if_?: number;
  tss?: number;
  kJ?: number;

  // Heart rate
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;

  // Zone seconds (flattened)
  z1_seconds: number;
  z2_seconds: number;
  z3_seconds: number;
  z4_seconds: number;
  z5_seconds: number;
  z6_seconds: number;
  z7_seconds: number;

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
  intensityBand: string;

  // Structure
  rideBreakup: string;

  // Hard tags
  hardTags: string[];

  // Data quality
  hasPowerData: boolean;
  hasHrData: boolean;
  powerDropoutSeconds: number;
  hrDropoutSeconds: number;
  unrealisticSpikes: number;

  // LLM-generated
  sessionTitle: string;
  coachSummary: string;
  loadNotes: string;
  pacingNotes: string;
  softTags: string[];

  // Combined text for embedding
  summary: string;
}

export class EmbeddingSync {
  private strava: StravaClient;
  private embedder: EmbeddingService;
  private pinecone: PineconeClient;
  private tracker: ActivityTracker;
  private llm: LLM;

  constructor(config: Config) {
    this.strava = new StravaClient(config.strava);
    this.embedder = new EmbeddingService(config.llm);
    this.pinecone = new PineconeClient(config.pinecone);
    this.tracker = new ActivityTracker(config);
    this.llm = new LLM(config);
  }

  async syncAthleteProfile(profile: AthleteProfile): Promise<void> {
    const summary = this.formatAthleteProfile(profile);
    const vector = await this.embedder.embedText(summary);

    await this.pinecone.upsert([
      {
        id: "athlete_profile",
        values: vector,
        metadata: {
          kind: "profile",
          ...Object.fromEntries(Object.entries(profile)
            .filter(([, value]) => value !== null && value !== undefined)
            .filter(([key]) => key !== 'bikes' && key !== 'clubs' && key !== 'shoes')),
          summary,
        },
      },
    ]);

    const profileChunk: ActivityChunk = {
      id: -1,
      name: "Athlete Profile",
      sportType: "profile",
      startDateLocal: new Date().toISOString().split('T')[0],
      elapsedTime: 0,
      movingTime: 0,
      distance: 0,
      description: `Athlete profile for ${profile.firstname ?? ""} ${profile.lastname ?? ""}`,
      summary: summary,
    };

    await this.tracker.trackActivitySync(profileChunk);
  }

  async syncActivities(daysBack: number = 90): Promise<number> {
    const after = Math.floor((Date.now() - daysBack * 24 * 60 * 60 * 1000) / 1000);
    const activities = await this.strava.listActivities({ after });

    let syncedCount = 0;
    for (const activity of activities) {
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        const detailed = await this.strava.getActivity(activity.id);

        // Fetch streams
        await new Promise(resolve => setTimeout(resolve, 150));
        const streams = await this.strava.getActivityStreams(activity.id);

        // Get FTP from athlete profile
        let ftp = 180;
        try {
          const athlete = await this.strava.getAthlete();
          if (athlete.ftp) ftp = athlete.ftp;
        } catch { /* use default */ }

        // Step 1: Parser — deterministic computation
        const parsed = parseRide(detailed, streams, ftp);

        // Step 2: LLM — natural language (coachSummary, loadNotes, pacingNotes, etc.)
        const analysis = await analyzeActivity(this.llm, parsed);

        // Step 3: Build enriched metadata
        const enriched = this.buildEnrichedMetadata(detailed, parsed, analysis);

        // Upsert to Pinecone
        const vector = await this.embedder.embedText(enriched.summary);
        await this.pinecone.upsert([{
          id: `activity_${enriched.id}`,
          values: vector,
          metadata: enriched as unknown as Record<string, unknown>,
        }]);

        // Track
        const chunk = this.toActivityChunk(detailed, enriched.summary);
        await this.tracker.trackActivitySync(chunk);

        syncedCount++;
        console.log(`Synced activity ${enriched.id}: ${enriched.name} (${enriched.sessionType})`);
      } catch (err) {
        console.warn(`Failed to sync activity ${activity.id} (${activity.name}):`, err);
      }
    }

    return syncedCount;
  }

  private buildEnrichedMetadata(
    activity: StravaActivity,
    parsed: ParsedRide,
    analysis: ActivityAnalysis,
  ): EnrichedActivityMetadata {
    const summary = this.buildSummary(parsed, analysis);
    const opt = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

    return {
      kind: "activity",
      id: parsed.id,
      name: parsed.name,
      sportType: parsed.sportType,
      startDateLocal: parsed.startDate,
      elapsedTime: parsed.elapsedTime,
      movingTime: parsed.movingTime,
      distance: parsed.distance,
      totalElevationGain: parsed.elevationGain,
      avgSpeedKmh: parsed.avgSpeedKmh,
      avgPower: parsed.avgPower,
      maxPower: parsed.maxPower,
      np: parsed.np,
      if_: parsed.if_,
      tss: parsed.tss,
      kJ: parsed.kJ,
      avgHeartRate: parsed.avgHr,
      maxHeartRate: parsed.maxHr,
      avgCadence: opt(activity.average_cadence),
      z1_seconds: parsed.powerZoneSeconds.z1,
      z2_seconds: parsed.powerZoneSeconds.z2,
      z3_seconds: parsed.powerZoneSeconds.z3,
      z4_seconds: parsed.powerZoneSeconds.z4,
      z5_seconds: parsed.powerZoneSeconds.z5,
      z6_seconds: parsed.powerZoneSeconds.z6,
      z7_seconds: parsed.powerZoneSeconds.z7,
      firstHalfAvgPower: parsed.firstHalfAvgPower,
      secondHalfAvgPower: parsed.secondHalfAvgPower,
      fadePercent: parsed.fadePercent,
      vi: parsed.vi,
      surgeCount: parsed.surgeCount,
      intervalCount: parsed.intervalCount,
      intervalDetails: parsed.intervalDetails,
      sessionType: parsed.sessionType,
      intensityBand: parsed.intensityBand,
      rideBreakup: parsed.rideBreakup,
      hardTags: parsed.hardTags,
      hasPowerData: parsed.dataQuality.hasPowerData,
      hasHrData: parsed.dataQuality.hasHrData,
      powerDropoutSeconds: parsed.dataQuality.powerDropoutSeconds,
      hrDropoutSeconds: parsed.dataQuality.hrDropoutSeconds,
      unrealisticSpikes: parsed.dataQuality.unrealisticSpikes,
      sessionTitle: analysis.sessionTitle,
      coachSummary: analysis.coachSummary,
      loadNotes: analysis.loadNotes,
      pacingNotes: analysis.pacingNotes,
      softTags: analysis.softTags,
      summary,
    };
  }

  private buildSummary(parsed: ParsedRide, analysis: ActivityAnalysis): string {
    const date = new Date(parsed.startDate).toLocaleDateString();
    const durationMin = Math.round(parsed.movingTime / 60);
    const distanceKm = (parsed.distance / 1000).toFixed(1);
    const zTotal = Object.values(parsed.powerZoneSeconds).reduce((a, b) => a + b, 0);

    const parts: string[] = [
      `Activity on ${date}: ${parsed.name}.`,
      `Type: ${parsed.sportType}.`,
      `Duration: ${durationMin} minutes (${Math.round(parsed.elapsedTime / 60)} min elapsed).`,
      `Distance: ${distanceKm} km at ${parsed.avgSpeedKmh} km/h average speed.`,
      `Elevation gain: ${parsed.elevationGain} m.`,
      `Session type: ${parsed.sessionType}.`,
      `Intensity band: ${parsed.intensityBand}.`,
    ];

    if (parsed.avgPower !== undefined) parts.push(`Average power: ${parsed.avgPower} W.`);
    if (parsed.np !== undefined) parts.push(`Normalized Power (NP): ${parsed.np} W.`);
    if (parsed.maxPower !== undefined) parts.push(`Max power: ${parsed.maxPower} W.`);
    if (parsed.if_ !== undefined) parts.push(`Intensity Factor (IF): ${parsed.if_}.`);
    if (parsed.tss !== undefined) parts.push(`Training Stress Score (TSS): ${parsed.tss}.`);
    if (parsed.avgHr !== undefined) parts.push(`Average heart rate: ${parsed.avgHr} bpm.`);
    if (parsed.maxHr !== undefined) parts.push(`Max heart rate: ${parsed.maxHr} bpm.`);
    if (parsed.kJ !== undefined) parts.push(`Energy output: ${parsed.kJ} kJ.`);

    // Zone breakdown
    if (zTotal > 0) {
      const pct = (s: number) => ((s / zTotal) * 100).toFixed(0);
      const zoneDesc = [
        `Z1(Recovery) ${Math.round(parsed.powerZoneSeconds.z1 / 60)}min (${pct(parsed.powerZoneSeconds.z1)}%)`,
        `Z2(Endurance) ${Math.round(parsed.powerZoneSeconds.z2 / 60)}min (${pct(parsed.powerZoneSeconds.z2)}%)`,
        `Z3(Tempo) ${Math.round(parsed.powerZoneSeconds.z3 / 60)}min (${pct(parsed.powerZoneSeconds.z3)}%)`,
        `Z4(SweetSpot) ${Math.round(parsed.powerZoneSeconds.z4 / 60)}min (${pct(parsed.powerZoneSeconds.z4)}%)`,
        `Z5(Threshold) ${Math.round(parsed.powerZoneSeconds.z5 / 60)}min (${pct(parsed.powerZoneSeconds.z5)}%)`,
        `Z6(VO2Max) ${Math.round(parsed.powerZoneSeconds.z6 / 60)}min (${pct(parsed.powerZoneSeconds.z6)}%)`,
        `Z7(Anaerobic) ${Math.round(parsed.powerZoneSeconds.z7 / 60)}min (${pct(parsed.powerZoneSeconds.z7)}%)`,
      ].join(", ");
      parts.push(`Time in power zones: ${zoneDesc}.`);
    }

    // Pacing
    if (parsed.intervalCount > 0 && parsed.intervalDetails) {
      parts.push(`Intervals: ${parsed.intervalDetails}.`);
    }
    if (parsed.rideBreakup) {
      parts.push(`Ride structure: ${parsed.rideBreakup}.`);
    }
    if (parsed.fadePercent !== undefined) {
      parts.push(`Power fade: ${parsed.fadePercent}% (first half ${parsed.firstHalfAvgPower ?? "?"} W → second half ${parsed.secondHalfAvgPower ?? "?"} W).`);
    }
    if (parsed.vi !== undefined) {
      parts.push(`Variability Index: ${parsed.vi}.`);
    }

    // Hard tags
    if (parsed.hardTags.length > 0) {
      parts.push(`Tags: ${parsed.hardTags.join(", ")}.`);
    }

    // LLM sections
    if (analysis.coachSummary) parts.push(`Coach summary: ${analysis.coachSummary}`);
    if (analysis.loadNotes) parts.push(`Load notes: ${analysis.loadNotes}`);
    if (analysis.pacingNotes) parts.push(`Pacing notes: ${analysis.pacingNotes}`);

    // Soft tags
    if (analysis.softTags && analysis.softTags.length > 0) {
      parts.push(`Qualitative tags: ${analysis.softTags.join(", ")}.`);
    }

    return parts.join(" ");
  }

  private toActivityChunk(activity: StravaActivity, summary: string): ActivityChunk {
    const opt = <T>(v: T | null | undefined): T | undefined => v ?? undefined;
    return {
      id: activity.id,
      name: activity.name,
      sportType: activity.sport_type,
      startDateLocal: activity.start_date_local,
      elapsedTime: activity.elapsed_time,
      movingTime: activity.moving_time,
      distance: activity.distance,
      averagePower: opt(activity.average_watts),
      maxPower: opt(activity.max_watts),
      weightedAveragePower: opt(activity.weighted_average_watts),
      averageHeartRate: opt(activity.average_heartrate),
      maxHeartRate: opt(activity.max_heartrate),
      totalElevationGain: opt(activity.total_elevation_gain),
      averageCadence: opt(activity.average_cadence),
      averageSpeed: opt(activity.average_speed),
      kilojoules: opt(activity.kilojoules),
      description: opt(activity.description),
      summary,
    };
  }

  private formatAthleteProfile(profile: AthleteProfile): string {
    let parts = [`Athlete Profile for ${profile.firstname ?? "User"} ${profile.lastname ?? ""}.`];
    if (profile.ftp) parts.push(`FTP: ${profile.ftp}W.`);
    if (profile.weight) parts.push(`Weight: ${profile.weight}kg.`);
    if (profile.height) parts.push(`Height: ${profile.height}cm.`);
    if (profile.maxHeartRate) parts.push(`Max HR: ${profile.maxHeartRate}bpm.`);
    if (profile.yearsInCycling) parts.push(`Experience: ${profile.yearsInCycling} years in cycling.`);
    if (profile.preferredDisciplines?.length) {
      parts.push(`Preferred disciplines: ${profile.preferredDisciplines.join(", ")}.`);
    }
    return parts.join(" ");
  }
}
