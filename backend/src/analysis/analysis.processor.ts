import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalysisService } from './analysis.service';
import { JobStatusService } from '../common/queue/job-status.service';
import { MockQueue } from '../common/queue/mock-queue';
import { QUEUES } from '../common/queue/queue.constants';

@Injectable()
export class AnalysisJobHandler {
  private readonly logger = new Logger(AnalysisJobHandler.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly jobStatusService: JobStatusService,
  ) {}

  async process(job: Job<{ userId: string; activityId?: string; type: string }>): Promise<unknown> {
    const bullJobId = String(job.id);
    await this.jobStatusService.updateStatus(bullJobId, 'active').catch(() => {});

    const { userId, activityId, type } = job.data;
    this.logger.log(`Starting ${type} analysis for user: ${userId}`);

    try {
      let result: unknown;
      if (type === 'activity' && activityId) {
        result = await this.analysisService.generateActivityAnalysis(activityId, userId);
      } else if (type === 'weekly') {
        result = await this.analysisService.runWeeklyReview(userId);
      } else if (type === 'monthly') {
        result = await this.analysisService.runMonthlyReview(userId);
      } else {
        result = { skipped: true, type };
      }

      await this.jobStatusService.updateStatus(bullJobId, 'completed', {
        result: typeof result === 'object' && result !== null
          ? result as Record<string, unknown>
          : { value: result },
      });
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Analysis job ${bullJobId} failed: ${message}`);
      await this.jobStatusService.updateStatus(bullJobId, 'failed', { error: message });
      throw error;
    }
  }
}

@Injectable()
export class AnalysisMockProcessor implements OnApplicationBootstrap {
  constructor(
    private readonly analysisJobHandler: AnalysisJobHandler,
    @InjectQueue(QUEUES.ANALYSIS) private readonly queue: MockQueue,
  ) {}

  onApplicationBootstrap() {
    if (!(this.queue instanceof MockQueue)) return;
    this.queue.registerDirectHandler(async (jobName: string, data: { userId: string; activityId?: string; type: string }) => {
      const mockJob = {
        data: { ...data, type: data.type || jobName },
        name: jobName,
        id: `mock_${Date.now()}`,
      } as Job;
      return this.analysisJobHandler.process(mockJob);
    });
  }
}
