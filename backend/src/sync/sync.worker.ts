import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SyncJobHandler } from './sync.processor';
import { QUEUES } from '../common/queue/queue.constants';

@Processor(QUEUES.SYNC, { concurrency: 2 })
export class SyncWorker extends WorkerHost {
  constructor(private readonly syncJobHandler: SyncJobHandler) {
    super();
  }

  async process(job: Job<{ userId: string; type: string }>): Promise<{ newActivities: number }> {
    return this.syncJobHandler.process(job);
  }
}
