import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PlanService } from './plan.service';
import { MockQueue } from '../common/queue/mock-queue';

@Injectable()
export class PlanProcessor implements OnApplicationBootstrap {
  private readonly logger = new Logger(PlanProcessor.name);

  constructor(
    private readonly planService: PlanService,
    @InjectQueue('plan') private readonly queue: any,
  ) {}

  async onApplicationBootstrap() {
    if (this.queue instanceof MockQueue) {
      this.queue.registerDirectHandler(async (jobName: string, data: any) => {
        const mockJob = { data, name: jobName, id: `mock_${Date.now()}` } as Job;
        return this.process(mockJob);
      });
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, type, data } = job.data;
    this.logger.log(`Starting ${type} plan generation for user: ${userId}`);

    try {
      if (type === 'generate') {
        this.logger.debug(`Generating plan for user ${userId}`);
      }
    } catch (error: unknown) {
      this.logger.error(`Failed to process ${type} plan generation for user ${userId}: ${(error as Error).message}`);
      throw error;
    }
  }
}
