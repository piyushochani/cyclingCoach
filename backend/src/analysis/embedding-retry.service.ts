import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from '../activity/activity.schema';
import { ActivitySyncPipelineService } from './activity-sync-pipeline.service';

@Injectable()
export class EmbeddingRetryService {
  private readonly logger = new Logger(EmbeddingRetryService.name);

  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
    private readonly pipeline: ActivitySyncPipelineService,
  ) {}

  async retryFailedEmbeddings(limit = 20): Promise<{ retried: number; succeeded: number; failed: number }> {
    const activities = await this.activityModel
      .find({ embeddingStatus: 'failed' })
      .sort({ updatedAt: 1 })
      .limit(limit)
      .lean()
      .exec();

    let succeeded = 0;
    let failed = 0;

    for (const activity of activities) {
      const userId = String(activity.user);
      const stravaId = activity.stravaId;
      try {
        await this.pipeline.processActivity(
          {
            stravaId,
            id: stravaId,
            userFtp: (activity as any).userFtp,
            userMaxHr: (activity as any).userMaxHr,
          },
          userId,
          activity.rawActivity ?? undefined,
          activity.rawStreams ?? undefined,
        );
        const updated = await this.activityModel.findOne({ _id: activity._id }).lean().exec();
        if (updated?.embeddingStatus === 'done') succeeded++;
        else failed++;
      } catch (err) {
        failed++;
        this.logger.warn(`Retry failed for activity ${stravaId}: ${err}`);
      }
    }

    this.logger.log(`Embedding retry sweep: ${activities.length} attempted, ${succeeded} succeeded, ${failed} still failed`);
    return { retried: activities.length, succeeded, failed };
  }
}
