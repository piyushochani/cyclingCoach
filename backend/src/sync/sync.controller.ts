import { Controller, Get, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { UserId } from '../common/user-id.decorator';
import { SyncService } from './sync.service';
import { DEFAULT_QUEUE_JOB_OPTIONS } from '../common/queue/queue.module';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    @InjectQueue('sync') private readonly syncQueue: any,
  ) {}

  @Post('incremental')
  @HttpCode(202)
  async incrementalSync(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    const job = await this.syncQueue.add(
      'incremental',
      { userId, type: 'incremental' },
      DEFAULT_QUEUE_JOB_OPTIONS,
    );
    return { jobId: job.id };
  }

  @Post('refresh')
  @HttpCode(202)
  async fullSync(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    const job = await this.syncQueue.add(
      'full',
      { userId, type: 'full' },
      DEFAULT_QUEUE_JOB_OPTIONS,
    );
    return { jobId: job.id };
  }

  @Get('status')
  async syncStatus(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.syncService.getSyncStatus(userId);
  }

  @Post('latest')
  @HttpCode(202)
  async syncLatest(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    const job = await this.syncQueue.add(
      'latest',
      { userId, type: 'latest' },
      DEFAULT_QUEUE_JOB_OPTIONS,
    );
    return { jobId: job.id };
  }

  @Post('analyze')
  async analyzeLatest(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.syncService.analyzeLatestActivity(userId);
  }
}
