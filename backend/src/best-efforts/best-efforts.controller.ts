import { Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { BestEffortsService } from './best-efforts.service';

@Controller('best-efforts')
export class BestEffortsController {
  constructor(private readonly bestEffortsService: BestEffortsService) {}

  @Get()
  getBestEfforts(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.bestEffortsService.getCachedResults(userId);
  }

  @Post('refresh')
  refresh(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.bestEffortsService.triggerBackgroundSync(userId);
  }

  @Get('status')
  syncStatus(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.bestEffortsService.getSyncStatus(userId);
  }
}
