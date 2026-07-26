import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BestEffortsService } from './best-efforts.service';
import { JobStatusService } from '../common/queue/job-status.service';
import { MockQueue } from '../common/queue/mock-queue';
import { QUEUES } from '../common/queue/queue.constants';

@Injectable()
export class BestEffortsJobHandler {
  private readonly logger = new Logger(BestEffortsJobHandler.name);

  constructor(
    private readonly bestEffortsService: BestEffortsService,
    private readonly jobStatusService: JobStatusService,
  ) {}

  async process(job: Job<{ userId: string }>): Promise<{ status: string }> {
    const bullJobId = String(job.id);
    const { userId } = job.data;
    await this.jobStatusService.updateStatus(bullJobId, 'active').catch(() => {});

    try {
      const result = await this.bestEffortsService.executeSync(userId);
      await this.jobStatusService.updateStatus(bullJobId, 'completed', { result });
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Best-efforts job ${bullJobId} failed: ${message}`);
      await this.jobStatusService.updateStatus(bullJobId, 'failed', { error: message });
      throw error;
    }
  }
}

@Injectable()
export class BestEffortsMockProcessor implements OnApplicationBootstrap {
  constructor(
    private readonly bestEffortsJobHandler: BestEffortsJobHandler,
    @InjectQueue(QUEUES.BEST_EFFORTS) private readonly queue: MockQueue,
  ) {}

  onApplicationBootstrap() {
    if (!(this.queue instanceof MockQueue)) return;
    this.queue.registerDirectHandler(async (_jobName: string, data: { userId: string }) => {
      const mockJob = { data, name: 'refresh', id: `mock_${Date.now()}` } as Job;
      return this.bestEffortsJobHandler.process(mockJob);
    });
  }
}
