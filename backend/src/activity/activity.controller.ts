import { Controller, Get, Post, Put, Delete, Param, Body, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { ActivityService } from './activity.service';
import { AnalysisService } from '../analysis/analysis.service';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { Types } from 'mongoose';

@Controller('activities')
export class ActivityController {
  private readonly logger = new Logger(ActivityController.name);

  constructor(
    private readonly activityService: ActivityService,
    private readonly analysisService: AnalysisService,
  ) {}

  @Get()
  findAll(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.findAllByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    if (id === 'undefined' || id === 'null' || !id) {
      throw new BadRequestException('Activity ID is missing or invalid');
    }
    const activity = await this.activityService.findOne(id, userId);
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    return activity;
  }

  @Post()
  create(@Body() activityData: CreateActivityDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.create({ ...activityData, date: new Date(activityData.date), user: userId as any });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateActivityDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.update(id, { ...data, date: data.date ? new Date(data.date) : undefined }, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.delete(id, userId);
  }

  @Post(':id/review')
  async review(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    if (id === 'undefined' || id === 'null' || !id) {
      throw new BadRequestException('Activity ID is missing or invalid');
    }
    this.logger.log(`Deep review requested for activity ${id}`);
    return this.analysisService.deepReviewActivity(id, userId);
  }
}
