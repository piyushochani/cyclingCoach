import { Controller, Get, Post, Param, Body, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { ModelChangeService } from './model-change.service';

@Controller('model-changes')
export class ModelChangeController {
  constructor(private readonly service: ModelChangeService) {}

  @Get('pending')
  getPending(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.getPendingRecommendation(userId);
  }

  @Get('history')
  getHistory(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.getRecommendationHistory(userId);
  }

  @Post(':id/respond')
  respond(
    @Param('id') id: string,
    @Body() body: { decision: 'accepted' | 'declined' | 'snoozed' },
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.respondToRecommendation(userId, id, body.decision);
  }

  @Post('check-window')
  checkWindow(
    @Body() body: {
      weeksUntilRace?: number;
      raceType?: string;
      isInTaper?: boolean;
      hasInjury?: boolean;
      fatigueLevel?: string;
    },
  ) {
    return this.service.checkChangeWindow(
      body.weeksUntilRace ?? null,
      body.raceType,
      body.isInTaper,
      body.hasInjury,
      body.fatigueLevel,
      true,
    );
  }

  @Post('auto-apply')
  tryAutoApply(
    @Body() body: {
      weeksUntilRace?: number;
      isInTaper?: boolean;
      hasInjury?: boolean;
      fatigueLevel?: string;
    },
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.tryAutoApply(
      userId,
      body.weeksUntilRace ?? null,
      body.isInTaper ?? false,
      body.hasInjury ?? false,
      body.fatigueLevel ?? 'low',
    );
  }
}
