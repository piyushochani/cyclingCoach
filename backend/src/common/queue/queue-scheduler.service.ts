import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { DEFAULT_QUEUE_JOB_OPTIONS } from './queue.module';
import { MockQueue } from './mock-queue';

@Injectable()
export class QueueSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(QueueSchedulerService.name);

  constructor(@InjectQueue('analysis') private readonly analysisQueue: any) {}

  async onApplicationBootstrap() {
    if (this.analysisQueue instanceof MockQueue) {
      this.logger.debug('MockQueue active — skipping repeatable job registration');
      return;
    }

    if (process.env.REDIS_ENABLED === 'false') return;

    try {
      await this.analysisQueue.add(
        'embedding-retry',
        { type: 'embedding-retry' },
        {
          ...DEFAULT_QUEUE_JOB_OPTIONS,
          repeat: { pattern: '0 */6 * * *' },
          jobId: 'embedding-retry-sweep',
        },
      );
      this.logger.log('Registered repeatable embedding-retry job (every 6 hours)');
    } catch (err) {
      this.logger.warn(`Could not register repeatable jobs: ${err}`);
    }
  }
}
