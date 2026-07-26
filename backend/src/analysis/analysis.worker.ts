import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalysisJobHandler } from './analysis.processor';
import { QUEUES } from '../common/queue/queue.constants';

@Processor(QUEUES.ANALYSIS, { concurrency: 3 })
export class AnalysisWorker extends WorkerHost {
  constructor(private readonly analysisJobHandler: AnalysisJobHandler) {
    super();
  }

  async process(job: Job<{ userId: string; activityId?: string; type: string }>): Promise<unknown> {
    return this.analysisJobHandler.process(job);
  }
}
