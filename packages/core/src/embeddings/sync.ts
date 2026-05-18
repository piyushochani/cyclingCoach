import { StravaClient, type StravaActivity, type StravaAthlete } from "../strava/client.js";
import { EmbeddingService } from "./service.js";
import { PineconeClient } from "./pinecone.js";
import { ActivityTracker } from "./activity-tracker.js";
import { analyzeActivity, computeTimeInZones, type ActivityAnalysis, type ZoneDistribution } from "./analysis.js";
import { LLM } from "../llm.js";
import type { Config } from "../config.js";
import type { ActivityChunk, AthleteProfile } from "../reference/schemas/strava.js";

export interface EnrichedActivityMetadata {
  kind: "activity";

  // Raw Strava fields
  id: number;
  name: string;
  sportType: string;
  startDateLocal: string;
  elapsedTime: number;
  movingTime: number;
  distance: number;
  averagePower?: number;
  maxPower?: number;
  weightedAveragePower?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  totalElevationGain?: number;
  averageCadence?: number;
  averageSpeedKmh?: number;
  description?: string;

  // Zone analysis (flattened for Pinecone metadata — no nested objects)
  z1_seconds: number;
  z2_seconds: number;
  z3_seconds: number;
  z4_seconds: number;
  z5_seconds: number;
  z6_seconds: number;
  z7_seconds: number;

  // LLM-generated analysis
  rideType: string;
  rideBreakup: string;
  overallIntensity: string;
  couldBeBetter: string;
  dietRecommendation: string;
  reviewSummary: string;
  tags: string[];

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

        // Fetch streams for zone analysis
        await new Promise(resolve => setTimeout(resolve, 150));
        const streams = await this.strava.getActivityStreams(activity.id);

        // Get FTP from athlete profile
        let ftp = 180;
        try {
          const athlete = await this.strava.getAthlete();
          if (athlete.ftp) ftp = athlete.ftp;
        } catch { /* use default */ }

        // Compute time in zones
        const zoneSeconds = computeTimeInZones(streams.watts, ftp);

        // Analyze with LLM (pass power stream for fallback breakup computation)
        const analysis = await analyzeActivity(this.llm, detailed, zoneSeconds, ftp, streams.watts);

        // Build enriched metadata
        const enriched = this.buildEnrichedMetadata(detailed, zoneSeconds, analysis);

        // Upsert to Pinecone (metadata must only have scalar / string[] values)
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
        console.log(`Synced activity ${enriched.id}: ${enriched.name} (${enriched.rideType})`);
      } catch (err) {
        console.warn(`Failed to sync activity ${activity.id} (${activity.name}):`, err);
      }
    }

    return syncedCount;
  }

  private buildEnrichedMetadata(
    activity: StravaActivity,
    zoneSeconds: ZoneDistribution,
    analysis: ActivityAnalysis,
  ): EnrichedActivityMetadata {
    const summary = this.buildSummary(activity, zoneSeconds, analysis);
    const opt = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

    return {
      kind: "activity",
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
      averageSpeedKmh: activity.average_speed ? Math.round(activity.average_speed * 3.6 * 10) / 10 : undefined,
      description: opt(activity.description),
      z1_seconds: zoneSeconds.z1,
      z2_seconds: zoneSeconds.z2,
      z3_seconds: zoneSeconds.z3,
      z4_seconds: zoneSeconds.z4,
      z5_seconds: zoneSeconds.z5,
      z6_seconds: zoneSeconds.z6,
      z7_seconds: zoneSeconds.z7,
      rideType: analysis.rideType,
      rideBreakup: analysis.rideBreakup,
      overallIntensity: analysis.overallIntensity,
      couldBeBetter: analysis.couldBeBetter,
      dietRecommendation: analysis.dietRecommendation,
      reviewSummary: analysis.reviewSummary,
      tags: analysis.tags,
      summary,
    };
  }

  private buildSummary(
    activity: StravaActivity,
    zoneSeconds: ZoneDistribution,
    analysis: ActivityAnalysis,
  ): string {
    const date = new Date(activity.start_date_local).toLocaleDateString();
    const durationMin = Math.round(activity.moving_time / 60);
    const movingHours = activity.moving_time / 3600;
    const distanceKm = (activity.distance / 1000).toFixed(1);
    const avgSpeedKmh = movingHours > 0 ? (activity.distance / 1000 / movingHours).toFixed(1) : "?";
    const zTotal = Object.values(zoneSeconds).reduce((a, b) => a + b, 0);

    const parts: string[] = [
      `Activity on ${date}: ${activity.name}.`,
      `Type: ${activity.sport_type}.`,
      `Duration: ${durationMin} minutes (${Math.round(activity.elapsed_time / 60)} min elapsed).`,
      `Distance: ${distanceKm} km at ${avgSpeedKmh} km/h average speed.`,
      `Elevation gain: ${Math.round(activity.total_elevation_gain ?? 0)}m.`,
      `Ride type: ${analysis.rideType}.`,
      `Overall intensity: ${analysis.overallIntensity}.`,
    ];

    if (activity.average_watts !== null && activity.average_watts !== undefined) {
      parts.push(`Average power: ${Math.round(activity.average_watts)}W.`);
    }
    if (activity.weighted_average_watts !== null && activity.weighted_average_watts !== undefined) {
      parts.push(`Weighted average power (NP): ${Math.round(activity.weighted_average_watts)}W.`);
    }
    if (activity.max_watts !== null && activity.max_watts !== undefined) {
      parts.push(`Max power: ${Math.round(activity.max_watts)}W.`);
    }
    if (activity.average_heartrate !== null && activity.average_heartrate !== undefined) {
      parts.push(`Average heart rate: ${Math.round(activity.average_heartrate)} bpm.`);
    }
    if (activity.max_heartrate !== null && activity.max_heartrate !== undefined) {
      parts.push(`Max heart rate: ${Math.round(activity.max_heartrate)} bpm.`);
    }
    if (activity.average_cadence !== null && activity.average_cadence !== undefined) {
      parts.push(`Average cadence: ${Math.round(activity.average_cadence)} rpm.`);
    }
    if (activity.kilojoules !== null && activity.kilojoules !== undefined) {
      parts.push(`Energy output: ${Math.round(activity.kilojoules)} kJ.`);
    }

    // Zone breakdown
    if (zTotal > 0) {
      const pct = (s: number) => ((s / zTotal) * 100).toFixed(0);
      const zoneDesc = [
        `Z1(Recovery) ${Math.round(zoneSeconds.z1 / 60)}min (${pct(zoneSeconds.z1)}%)`,
        `Z2(Endurance) ${Math.round(zoneSeconds.z2 / 60)}min (${pct(zoneSeconds.z2)}%)`,
        `Z3(Tempo) ${Math.round(zoneSeconds.z3 / 60)}min (${pct(zoneSeconds.z3)}%)`,
        `Z4(SweetSpot) ${Math.round(zoneSeconds.z4 / 60)}min (${pct(zoneSeconds.z4)}%)`,
        `Z5(Threshold) ${Math.round(zoneSeconds.z5 / 60)}min (${pct(zoneSeconds.z5)}%)`,
        `Z6(VO2Max) ${Math.round(zoneSeconds.z6 / 60)}min (${pct(zoneSeconds.z6)}%)`,
        `Z7(Anaerobic) ${Math.round(zoneSeconds.z7 / 60)}min (${pct(zoneSeconds.z7)}%)`,
      ].join(", ");
      parts.push(`Time in power zones: ${zoneDesc}.`);
    }

    // Ride structure
    if (analysis.rideBreakup) {
      parts.push(`Ride structure: ${analysis.rideBreakup}.`);
    }

    // Feedback
    if (analysis.couldBeBetter) {
      parts.push(`Improvement suggestions: ${analysis.couldBeBetter}`);
    }
    if (analysis.dietRecommendation) {
      parts.push(`Nutrition: ${analysis.dietRecommendation}`);
    }
    if (analysis.reviewSummary) {
      parts.push(`Review: ${analysis.reviewSummary}`);
    }
    if (analysis.tags && analysis.tags.length > 0) {
      parts.push(`Tags: ${analysis.tags.join(", ")}.`);
    }
    if (activity.description) {
      parts.push(`Athlete notes: ${activity.description}`);
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
