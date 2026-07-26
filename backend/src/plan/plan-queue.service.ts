import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEnqueueService, EnqueueResult } from '../common/queue/queue-enqueue.service';
import { MockQueue } from '../common/queue/mock-queue';
import { QUEUES } from '../common/queue/queue.constants';

@Injectable()
export class PlanQueueService {
  constructor(
    private readonly queueEnqueue: QueueEnqueueService,
    @InjectQueue(QUEUES.PLAN) private readonly planQueue: Queue | MockQueue,
  ) {}

  enqueueEnsurePlans(userId: string): Promise<EnqueueResult> {
    return this.queueEnqueue.enqueue(
      this.planQueue,
      QUEUES.PLAN,
      'ensure-plans',
      { userId, type: 'ensure-plans' },
      userId,
    );
  }
}
