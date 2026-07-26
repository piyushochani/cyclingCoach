import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BestEffortsJobHandler } from './best-efforts.processor';
import { QUEUES } from '../common/queue/queue.constants';

@Processor(QUEUES.BEST_EFFORTS, { concurrency: 1 })
export class BestEffortsWorker extends WorkerHost {
  constructor(private readonly bestEffortsJobHandler: BestEffortsJobHandler) {
    super();
  }

  async process(job: Job<{ userId: string }>): Promise<{ status: string }> {
    return this.bestEffortsJobHandler.process(job);
  }
}
