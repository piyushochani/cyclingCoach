import { Controller, Get, NotFoundException, Param, UnauthorizedException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { UserId } from '../user-id.decorator';
import { MockQueue } from './mock-queue';

@Controller('jobs')
export class JobsController {
  constructor(
    @InjectQueue('sync') private readonly syncQueue: any,
    @InjectQueue('analysis') private readonly analysisQueue: any,
    @InjectQueue('plan') private readonly planQueue: any,
  ) {}

  @Get(':id')
  async getJobStatus(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');

    const job = await this.findJob(id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);

    const data = job.data || {};
    if (data.userId && data.userId !== userId) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    if (typeof job.getState !== 'function') {
      return {
        id: job.id,
        name: job.name,
        status: job.status || 'completed',
        result: job.returnvalue ?? null,
        failedReason: job.failedReason ?? null,
      };
    }

    const status = await job.getState();
    return {
      id: job.id,
      name: job.name,
      status,
      result: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
      progress: job.progress ?? 0,
    };
  }

  private async findJob(id: string): Promise<any> {
    for (const queue of [this.syncQueue, this.analysisQueue, this.planQueue]) {
      if (queue instanceof MockQueue) {
        const job = await queue.getJob(id);
        if (job) return job;
      } else if (typeof queue.getJob === 'function') {
        const job = await queue.getJob(id);
        if (job) return job;
      }
    }
    return null;
  }
}
