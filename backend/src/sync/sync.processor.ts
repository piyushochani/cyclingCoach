import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SyncService } from './sync.service';
import { AnalysisService } from '../analysis/analysis.service';
import { MockQueue } from '../common/queue/mock-queue';

@Processor('sync')
@Injectable()
export class SyncProcessor extends WorkerHost implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly analysisService: AnalysisService,
    @InjectQueue('sync') private readonly queue: any,
  ) {
    super();
  }

  async onApplicationBootstrap() {
    if (this.queue instanceof MockQueue) {
      this.queue.registerDirectHandler(async (jobName: string, data: any) => {
        const mockJob = { data, name: jobName, id: `mock_${Date.now()}` } as Job;
        return this.process(mockJob);
      });
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId } = job.data;
    const type = job.data.type || job.name;
    this.logger.log(`Starting ${type} sync for user: ${userId}`);

    try {
      let result;
      if (type === 'incremental') {
        result = await this.syncService.incrementalSync(userId);
      } else if (type === 'full') {
        result = await this.syncService.fullSync(userId);
      } else if (type === 'latest') {
        result = await this.syncService.syncLatestActivity(userId);
      }

      if (result && result.newActivities > 0) {
        this.logger.log(`Sync complete. Triggering background analysis for user: ${userId}`);
        await this.analysisService.queueWeeklyReview(userId);
      }

      return result;
    } catch (error: unknown) {
      this.logger.error(`Failed to process ${type} sync for user ${userId}: ${(error as Error).message}`);
      throw error;
    }
  }
}
