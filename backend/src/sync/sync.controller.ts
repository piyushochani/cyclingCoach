import { Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { SyncService } from './sync.service';
import { SyncQueueService } from './sync-queue.service';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly syncQueueService: SyncQueueService,
  ) {}

  @Post('incremental')
  async incrementalSync(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    const enqueued = await this.syncQueueService.enqueueIncrementalSync(userId);
    if (enqueued.async) {
      return { jobId: enqueued.jobId, status: enqueued.status };
    }
    return enqueued.result ?? { newActivities: 0 };
  }

  @Post('refresh')
  async fullSync(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    const enqueued = await this.syncQueueService.enqueueFullSync(userId);
    if (enqueued.async) {
      return { jobId: enqueued.jobId, status: enqueued.status };
    }
    return enqueued.result ?? { newActivities: 0 };
  }

  @Get('status')
  async syncStatus(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.syncService.getSyncStatus(userId);
  }

  @Post('latest')
  async syncLatest(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.syncService.syncLatestActivity(userId);
  }

  @Post('analyze')
  async analyzeLatest(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.syncService.analyzeLatestActivity(userId);
  }
}
