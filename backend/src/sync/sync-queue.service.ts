import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SyncService } from './sync.service';
import { AnalysisService } from '../analysis/analysis.service';
import { QUEUES } from '../common/queue/queue.constants';
import { QueueEnqueueService, EnqueueResult } from '../common/queue/queue-enqueue.service';
import { MockQueue } from '../common/queue/mock-queue';

@Injectable()
export class SyncQueueService {
  private readonly logger = new Logger(SyncQueueService.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly analysisService: AnalysisService,
    private readonly queueEnqueue: QueueEnqueueService,
    @InjectQueue(QUEUES.SYNC) private readonly syncQueue: Queue | MockQueue,
  ) {}

  async enqueueFullSync(userId: string): Promise<EnqueueResult> {
    return this.queueEnqueue.enqueue(
      this.syncQueue,
      QUEUES.SYNC,
      'full',
      { userId, type: 'full' },
      userId,
    );
  }

  async enqueueIncrementalSync(userId: string): Promise<EnqueueResult> {
    return this.queueEnqueue.enqueue(
      this.syncQueue,
      QUEUES.SYNC,
      'incremental',
      { userId, type: 'incremental' },
      userId,
    );
  }

  /** Shared handler for sync workers (BullMQ + MockQueue). */
  async handleSyncJob(jobName: string, data: { userId: string; type: string }) {
    const { userId, type } = data;
    this.logger.log(`Processing ${type} sync for user: ${userId}`);

    let result: { newActivities: number };
    if (type === 'incremental' || jobName === 'incremental') {
      result = await this.syncService.incrementalSync(userId);
    } else {
      result = await this.syncService.fullSync(userId);
    }

    if (result.newActivities > 0) {
      this.logger.log(`Sync complete. Queueing weekly review for user: ${userId}`);
      await this.analysisService.queueWeeklyReview(userId);
    }

    return result;
  }
}
