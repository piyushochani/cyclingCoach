import { Controller, Get, Post, Put, Delete, Param, Body, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { RacePlanService } from './race-plan.service';

@Controller('races/:raceId/plan')
export class RacePlanController {
  constructor(private readonly racePlanService: RacePlanService) {}

  @Get()
  findByRace(@Param('raceId') raceId: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.racePlanService.findByRace(raceId);
  }

  @Post()
  create(@Param('raceId') raceId: string, @Body() body: { days: any[] }, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.racePlanService.create(raceId, userId, body.days);
  }

  @Put()
  update(@Param('raceId') raceId: string, @Body() body: { days: any[] }, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.racePlanService.update(raceId, userId, body.days);
  }

  @Delete()
  delete(@Param('raceId') raceId: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.racePlanService.delete(raceId, userId);
  }
}
