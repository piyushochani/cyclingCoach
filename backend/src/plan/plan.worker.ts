import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PlanJobHandler } from './plan.processor';
import { QUEUES } from '../common/queue/queue.constants';

@Processor(QUEUES.PLAN, { concurrency: 2 })
export class PlanWorker extends WorkerHost {
  constructor(private readonly planJobHandler: PlanJobHandler) {
    super();
  }

  async process(job: Job<{ userId: string; type: string }>): Promise<unknown> {
    return this.planJobHandler.process(job);
  }
}
