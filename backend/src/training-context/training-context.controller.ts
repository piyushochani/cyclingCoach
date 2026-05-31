import { Controller, Get, Post, Put, Delete, Param, Body, Query, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { TrainingContextService } from './training-context.service';

@Controller('training-context')
export class TrainingContextController {
  constructor(private readonly service: TrainingContextService) {}

  // ── Month Context ──

  @Get('months')
  getMonthContexts(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.getMonthContexts(userId);
  }

  @Post('months')
  upsertMonthContext(
    @Body() body: { year: number; month: number; summary?: any; rawText?: string },
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.upsertMonthContext(userId, body.year, body.month, body);
  }

  // ── Week Context ──

  @Get('weeks')
  getWeekContexts(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.getWeekContexts(userId);
  }

  @Post('weeks')
  upsertWeekContext(
    @Body() body: { year: number; week: number; summary?: any; rawText?: string },
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.upsertWeekContext(userId, body.year, body.week, body);
  }

  // ── Pre-Race Week Plans ──

  @Get('pre-race/:raceId')
  getPreRacePlans(@Param('raceId') raceId: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.getPreRacePlans(raceId, userId);
  }

  @Post('pre-race/:raceId')
  upsertPreRacePlan(
    @Param('raceId') raceId: string,
    @Body() body: { weekOffset: number; label?: string; startDate: string; workouts?: any[]; coachNotes?: string },
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.upsertPreRacePlan(raceId, userId, body.weekOffset, {
      label: body.label,
      startDate: new Date(body.startDate),
      workouts: body.workouts || [],
      coachNotes: body.coachNotes || '',
    });
  }

  @Delete('pre-race/:raceId/:weekOffset')
  deletePreRacePlan(
    @Param('raceId') raceId: string,
    @Param('weekOffset') weekOffset: number,
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.deletePreRacePlan(raceId, userId, +weekOffset);
  }

  // ── Weekly Plan ──

  @Get('weekly-plan')
  getWeeklyPlan(
    @Query('relativeWeek') relativeWeek: string,
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    if (relativeWeek) {
      return this.service.getWeeklyPlan(userId, +relativeWeek);
    }
    return this.service.getCurrentWeekPlan(userId);
  }

  @Post('weekly-plan')
  upsertWeeklyPlan(
    @Body() body: { relativeWeek: number; workouts?: any[]; skeleton?: any; coachNotes?: string; rawText?: string },
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    if (body.relativeWeek == null) throw new UnauthorizedException('relativeWeek is required');
    const data = {
      workouts: body.workouts || [],
      coachNotes: body.coachNotes || '',
      rawText: body.rawText || '',
    };
    if (body.skeleton) {
      return this.service.upsertWeeklyPlanWithSkeleton(userId, body.relativeWeek, data, body.skeleton);
    }
    return this.service.upsertWeeklyPlan(userId, body.relativeWeek, data);
  }

  @Delete('weekly-plan')
  deleteWeeklyPlan(
    @Query('relativeWeek') relativeWeek: string,
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.service.deleteWeeklyPlan(userId, +relativeWeek);
  }
}
