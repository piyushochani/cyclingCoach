import { Controller, Post, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('incremental')
  async incrementalSync(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.syncService.incrementalSync(userId);
  }

  @Post('refresh')
  async fullSync(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.syncService.fullSync(userId);
  }
}
