import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalysisService } from './analysis.service';
import { MockQueue } from '../common/queue/mock-queue';

@Processor('analysis')
@Injectable()
export class AnalysisProcessor extends WorkerHost implements OnApplicationBootstrap {
  private readonly logger = new Logger(AnalysisProcessor.name);

  constructor(
    private readonly analysisService: AnalysisService,
    @InjectQueue('analysis') private readonly queue: any,
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
    const { userId, activityId } = job.data;
    const type = job.data.type || job.name;
    this.logger.log(`Starting ${type} analysis for user: ${userId}`);

    try {
      if (type === 'activity') {
        this.logger.debug(`Generating activity analysis for ${activityId}`);
        await this.analysisService.generateActivityAnalysis(activityId, userId);
      } else if (type === 'weekly') {
        return await this.analysisService.queueWeeklyReview(userId);
      } else if (type === 'monthly') {
        return await this.analysisService.queueMonthlyReview(userId);
      } else if (type === 'plan') {
        this.logger.debug(`Plan generation requested for user: ${userId}`);
      }
    } catch (error: unknown) {
      this.logger.error(`Failed to process ${type} analysis for user ${userId}: ${(error as Error).message}`);
      throw error;
    }
  }
}
