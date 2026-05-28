import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  getStats(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.statsService.getUserStats(userId);
  }
}
