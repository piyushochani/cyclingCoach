import { Injectable, Logger } from '@nestjs/common';
import { DataProcessorService, ProcessedActivity } from './data-processor.service';
import { PineconeClient } from './pinecone-client';
import { EmbeddingService } from './embedding.service';
import { DEFAULT_RAG_MIN_SCORE, formatRagMatchesForReview } from './rag-context.util';

export interface AthleteProfile {
  ftp: number | null;
  weightKg: number | null;
  heightCm: number | null;
  experienceLevel: string;
  goal: string;
  mainSport: string;
  cyclingYears: number;
  maxHeartrate: number | null;
  age: number | null;
  onboardingSummary: string;
}

export interface EnrichedContext {
  athlete: AthleteProfile;
  activities: ProcessedActivity[];
  summary: string;
  weatherNote: string;
  trainingPhaseNote: string;
  historicalContext: string;
}

@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);

  constructor(
    private readonly dataProcessor: DataProcessorService,
    private readonly pinecone: PineconeClient,
    private readonly embedder: EmbeddingService,
  ) {}

  async buildContext(
    user: any,
    activities: any[],
    previousActivities?: any[],
  ): Promise<EnrichedContext> {
    const athlete: AthleteProfile = {
      ftp: user?.ftp ?? null,
      weightKg: user?.weightKg ?? null,
      heightCm: user?.heightCm ?? null,
      experienceLevel: user?.experienceLevel || 'beginner',
      goal: user?.goal || '',
      mainSport: user?.mainSport || 'cycling',
      cyclingYears: user?.cyclingYears || 0,
      maxHeartrate: user?.maxHeartrate ?? null,
      age: user?.age ?? null,
      onboardingSummary: user?.onboardingSummary || '',
    };

    const athleteMaxHr = athlete.maxHeartrate || (athlete.age ? Math.round(220 - athlete.age) : undefined);
    const processed = activities.map((a) => this.dataProcessor.process(a, undefined, athlete.ftp ?? undefined, athleteMaxHr));
    const prevProcessed = previousActivities
      ? previousActivities.map((a) => this.dataProcessor.process(a, undefined, athlete.ftp ?? undefined, athleteMaxHr))
      : [];

    const summary = this.buildSummary(processed, prevProcessed);
    const weatherNote = this.buildWeatherNote(processed);
    const trainingPhaseNote = this.buildTrainingPhaseNote(processed, prevProcessed);
    const historicalContext = await this.buildHistoricalContext(processed, user?._id?.toString());

    return { athlete, activities: processed, summary, weatherNote, trainingPhaseNote, historicalContext };
  }

  private async buildHistoricalContext(activities: ProcessedActivity[], userId?: string): Promise<string> {
    if (!this.pinecone.isConfigured || !this.embedder.isConfigured || activities.length === 0 || !userId) {
      return '';
    }

    try {
      const queryText = activities.map((a) =>
        `${a.distanceKm.toFixed(1)} km ${a.sessionType} ride, ${a.terrainClass} terrain, ${a.avgSpeedKph.toFixed(1)} km/h avg`
      ).join('. ');

      const vector = await this.embedder.embedText(queryText);
      const result = await this.pinecone.query(vector, 5, {
        filter: { userId: { $eq: userId } },
        minScore: DEFAULT_RAG_MIN_SCORE,
      });

      return formatRagMatchesForReview(result.matches);
    } catch (err) {
      this.logger.warn(`Pinecone RAG query failed: ${err}`);
      return '';
    }
  }

  private buildSummary(activities: ProcessedActivity[], previous: ProcessedActivity[]): string {
    const totalKm = activities.reduce((s, a) => s + a.distanceKm, 0);
    const totalHours = activities.reduce((s, a) => s + a.movingTimeMin / 60, 0);
    const totalElev = activities.reduce((s, a) => s + a.elevationGain, 0);
    const count = activities.length;
    const prevKm = previous.reduce((s, a) => s + a.distanceKm, 0);

    let summary = '';
    if (count === 0) {
      summary = 'No activities in this period.';
    } else {
      summary = [
        `${count} activities`,
        `${totalKm.toFixed(1)} km`,
        `${totalHours.toFixed(1)} hours`,
        `${totalElev.toFixed(0)} m elevation`,
        previous.length > 0
          ? `vs. ${prevKm.toFixed(1)} km previous period`
          : '',
      ]
        .filter(Boolean)
        .join(', ');
    }
    return summary;
  }

  private buildWeatherNote(activities: ProcessedActivity[]): string {
    const indoorCount = activities.filter((a) => a.trainer).length;
    if (indoorCount === activities.length) return 'All activities were indoor (trainer).';
    if (indoorCount > 0) return `${indoorCount} of ${activities.length} activities were indoor.`;
    return 'All activities were outdoor. No specific weather data available for individual rides.';
  }

  private buildTrainingPhaseNote(activities: ProcessedActivity[], previous: ProcessedActivity[]): string {
    const sessionTypes = activities.map((a) => a.sessionType);
    const uniqueTypes = [...new Set(sessionTypes)].filter((t) => t !== 'unknown');

    if (uniqueTypes.length === 0) return 'Mixed training with no clear intensity pattern.';

    if (uniqueTypes.includes('race-like')) return 'Race effort detected — peak week or event day.';
    if (uniqueTypes.includes('VO2max') || uniqueTypes.includes('threshold')) return 'High-intensity training block — threshold/VO2 work present.';
    if (uniqueTypes.includes('tempo')) return 'Sweet spot / tempo block — building sustainable power.';
    if (uniqueTypes.every((t) => t === 'endurance' || t === 'recovery')) return 'Endurance / recovery phase — building aerobic base.';

    return 'Mixed training phase.';
  }
}
