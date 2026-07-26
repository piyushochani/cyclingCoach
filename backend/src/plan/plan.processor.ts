import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PlanService } from './plan.service';
import { MockQueue } from '../common/queue/mock-queue';

@Processor('plan')
@Injectable()
export class PlanProcessor extends WorkerHost implements OnApplicationBootstrap {
  private readonly logger = new Logger(PlanProcessor.name);

  constructor(
    private readonly planService: PlanService,
    @InjectQueue('plan') private readonly queue: any,
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
    this.logger.log(`Starting ${type} plan generation for user: ${userId}`);

    try {
      if (type === 'generate') {
        this.logger.debug(`Generating plan for user ${userId}`);
        // Plan generation is handled via AnalysisService.generateNextWeekPlan for now
      }
    } catch (error: unknown) {
      this.logger.error(`Failed to process ${type} plan generation for user ${userId}: ${(error as Error).message}`);
      throw error;
    }
  }
}
