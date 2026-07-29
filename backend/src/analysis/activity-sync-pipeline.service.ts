import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PineconeClient } from './pinecone-client';
import { EmbeddingService } from './embedding.service';
import { DataProcessorService } from './data-processor.service';
import { SummaryBuilderService } from './summary-builder.service';
import { Activity } from '../activity/activity.schema';
import { truncateForMetadata } from './rag-context.util';

@Injectable()
export class ActivitySyncPipelineService {
  private readonly logger = new Logger(ActivitySyncPipelineService.name);

  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
    private readonly pinecone: PineconeClient,
    private readonly embedder: EmbeddingService,
    private readonly dataProcessor: DataProcessorService,
    private readonly summaryBuilder: SummaryBuilderService,
  ) {}

  async processActivity(activity: any, userId: string, rawActivity?: any, rawStreams?: any): Promise<void> {
    if (!this.pinecone.isConfigured || !this.embedder.isConfigured) {
      this.logger.debug('Pinecone or Embedding not configured, skipping pipeline');
      return;
    }

    if (!userId) {
      this.logger.warn('No userId provided, skipping pipeline');
      return;
    }

    const stravaId = activity.stravaId || activity.id;
    const vectorId = `${userId}-activity_${stravaId}`;

    try {
      const ftp = activity.userFtp || undefined;
      const maxHr = activity.userMaxHr || undefined;

      const processed = this.dataProcessor.process(
        { ...activity, ...rawActivity },
        rawStreams,
        ftp,
        maxHr,
      );

      const summaryText = this.summaryBuilder.build(processed);

      const embedding = await this.embedder.embedText(summaryText);

      await this.pinecone.upsert([{
        id: vectorId,
        values: embedding,
        metadata: {
          userId,
          activityId: String(stravaId),
          sportType: processed.sport || 'Ride',
          date: processed.date ? new Date(processed.date).toISOString().split('T')[0] : '',
          sessionType: processed.sessionType,
          terrainType: processed.terrainClass,
          distanceKm: processed.distanceKm,
          durationMin: processed.movingTimeMin,
          hasPower: processed.hasPowerData,
          hasHeartRate: processed.hasHrData,
          hasCadence: processed.hasCadenceData,
          summary: truncateForMetadata(summaryText),
        },
      }]);

      const now = new Date();
      await this.activityModel.updateOne(
        { stravaId, user: userId as any },
        {
          $set: {
            rawActivity: rawActivity ?? null,
            rawStreams: rawStreams ?? null,
            processed: processed as any,
            summaryText,
            vectorId,
            embeddingStatus: 'done',
            syncedAt: now,
            updatedAt: now,
          },
        },
      ).exec();

      this.logger.log(`Synced activity ${stravaId} to Pinecone (vector: ${vectorId})`);
    } catch (err) {
      await this.activityModel.updateOne(
        { stravaId, user: userId as any },
        { $set: { embeddingStatus: 'failed', updatedAt: new Date() } },
      ).exec();
      this.logger.error(`Failed to process activity ${stravaId} for Pinecone: ${err}`);
    }
  }

  async deleteActivityVector(stravaId: number, userId: string): Promise<void> {
    const vectorId = `${userId}-activity_${stravaId}`;
    try {
      await this.pinecone.deleteVectors([vectorId]);
      await this.activityModel.updateOne(
        { stravaId, user: userId as any },
        { $set: { vectorId: null, embeddingStatus: 'pending', updatedAt: new Date() } },
      ).exec();
      this.logger.log(`Deleted Pinecone vector ${vectorId}`);
    } catch (err) {
      this.logger.error(`Failed to delete vector ${vectorId}: ${err}`);
    }
  }
}
