import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalysisService } from '../analysis/analysis.service';
import { JobStatusService } from '../common/queue/job-status.service';
import { MockQueue } from '../common/queue/mock-queue';
import { QUEUES } from '../common/queue/queue.constants';

@Injectable()
export class PlanJobHandler {
  private readonly logger = new Logger(PlanJobHandler.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly jobStatusService: JobStatusService,
  ) {}

  async process(job: Job<{ userId: string; type: string }>): Promise<unknown> {
    const bullJobId = String(job.id);
    await this.jobStatusService.updateStatus(bullJobId, 'active').catch(() => {});

    try {
      let result: unknown;
      if (job.data.type === 'ensure-plans' || job.name === 'ensure-plans') {
        result = await this.analysisService.ensurePlans(job.data.userId);
      } else {
        result = { skipped: true };
      }

      await this.jobStatusService.updateStatus(bullJobId, 'completed', {
        result: result as Record<string, unknown>,
      });
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Plan job ${bullJobId} failed: ${message}`);
      await this.jobStatusService.updateStatus(bullJobId, 'failed', { error: message });
      throw error;
    }
  }
}

@Injectable()
export class PlanMockProcessor implements OnApplicationBootstrap {
  constructor(
    private readonly planJobHandler: PlanJobHandler,
    @InjectQueue(QUEUES.PLAN) private readonly queue: MockQueue,
  ) {}

  onApplicationBootstrap() {
    if (!(this.queue instanceof MockQueue)) return;
    this.queue.registerDirectHandler(async (jobName: string, data: { userId: string; type: string }) => {
      const mockJob = { data, name: jobName, id: `mock_${Date.now()}` } as Job;
      return this.planJobHandler.process(mockJob);
    });
  }
}
