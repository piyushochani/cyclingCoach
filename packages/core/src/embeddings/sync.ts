import { StravaClient, type StravaActivity, type StravaAthlete } from "../strava/client.js";
import { EmbeddingService } from "./service.js";
import { PineconeClient } from "./pinecone.js";
import type { Config } from "../config.js";
import type { ActivityChunk, AthleteProfile } from "../reference/schemas/strava.js";

export class EmbeddingSync {
  private strava: StravaClient;
  private embedder: EmbeddingService;
  private pinecone: PineconeClient;

  constructor(config: Config) {
    this.strava = new StravaClient(config.strava);
    this.embedder = new EmbeddingService(config.llm);
    this.pinecone = new PineconeClient(config.pinecone);
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
          ...profile,
          summary,
        },
      },
    ]);
  }

  async syncActivities(daysBack: number = 90): Promise<number> {
    const after = Math.floor((Date.now() - daysBack * 24 * 60 * 60 * 1000) / 1000);
    const activities = await this.strava.listActivities({ after });
    
    const chunks: ActivityChunk[] = [];
    for (const activity of activities) {
      // Get detailed activity for laps and description
      const detailed = await this.strava.getActivity(activity.id);
      chunks.push(this.mapToChunk(detailed));
    }

    if (chunks.length === 0) return 0;

    const summaries = chunks.map(c => c.summary);
    const vectors = await this.embedder.embedTexts(summaries);

    const pineconeVectors = chunks.map((chunk, i) => ({
      id: `activity_${chunk.id}`,
      values: vectors[i],
      metadata: {
        kind: "activity",
        ...chunk,
      },
    }));

    await this.pinecone.upsert(pineconeVectors);
    return chunks.length;
  }

  private mapToChunk(activity: StravaActivity): ActivityChunk {
    const summary = this.formatActivitySummary(activity);
    return {
      id: activity.id,
      name: activity.name,
      sportType: activity.sport_type,
      startDateLocal: activity.start_date_local,
      elapsedTime: activity.elapsed_time,
      movingTime: activity.moving_time,
      distance: activity.distance,
      averagePower: activity.average_watts,
      maxPower: activity.max_watts,
      weightedAveragePower: activity.weighted_average_watts,
      averageHeartRate: activity.average_heartrate,
      maxHeartRate: activity.max_heartrate,
      totalElevationGain: activity.total_elevation_gain,
      averageCadence: activity.average_cadence,
      averageSpeed: activity.average_speed,
      kilojoules: activity.kilojoules,
      description: activity.description,
      summary,
    };
  }

  private formatActivitySummary(activity: StravaActivity): string {
    const date = new Date(activity.start_date_local).toLocaleDateString();
    const duration = Math.round(activity.moving_time / 60);
    const distance = (activity.distance / 1000).toFixed(1);
    
    let parts = [
      `Activity on ${date}: ${activity.name}.`,
      `Type: ${activity.sport_type}.`,
      `Duration: ${duration} minutes.`,
      `Distance: ${distance} km.`,
    ];

    if (activity.average_watts) {
      parts.push(`Average power: ${Math.round(activity.average_watts)}W.`);
    }
    if (activity.average_heartrate) {
      parts.push(`Average heart rate: ${Math.round(activity.average_heartrate)} bpm.`);
    }
    if (activity.total_elevation_gain) {
      parts.push(`Elevation gain: ${Math.round(activity.total_elevation_gain)}m.`);
    }
    if (activity.description) {
      parts.push(`Notes: ${activity.description}`);
    }

    return parts.join(" ");
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
