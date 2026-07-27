import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DEFAULT_JOB_OPTIONS, buildJobId, isRedisEnabled } from './queue.constants';
import { JobStatusService } from './job-status.service';
import { MockQueue } from './mock-queue';

export interface EnqueueResult {
  jobId: string;
  status: 'queued' | 'completed';
  async: boolean;
  result?: Record<string, unknown>;
}

@Injectable()
export class QueueEnqueueService {
  constructor(private readonly jobStatusService: JobStatusService) {}

  async enqueue(
    queue: Queue | MockQueue,
    queueName: string,
    jobName: string,
    data: Record<string, unknown>,
    userId: string,
    options?: { skipDedupe?: boolean },
  ): Promise<EnqueueResult> {
    const jobId = options?.skipDedupe
      ? `${queueName}:${userId}:${jobName}:${Date.now()}`
      : buildJobId(queueName, userId, jobName);

    if (isRedisEnabled()) {
      const existing = await this.jobStatusService.getActiveForUser(userId, queueName, jobName);
      if (existing && !options?.skipDedupe) {
        return { jobId: existing.bullJobId, status: 'queued', async: true };
      }
    }

    const job = await queue.add(jobName, data, {
      ...DEFAULT_JOB_OPTIONS,
      jobId,
    });

    const bullJobId = String(job.id ?? jobId);

    if (isRedisEnabled()) {
      await this.jobStatusService.create({
        userId,
        bullJobId,
        queue: queueName,
        jobName,
      });
      return { jobId: bullJobId, status: 'queued', async: true };
    }

    // MockQueue executes inline; job is already done
    return {
      jobId: bullJobId,
      status: 'completed',
      async: false,
      result: (job as { returnvalue?: Record<string, unknown> }).returnvalue,
    };
  }
}
