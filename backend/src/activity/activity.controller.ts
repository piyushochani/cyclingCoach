import { Controller, Get, Post, Put, Delete, Param, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { ActivityService } from './activity.service';
import { Types } from 'mongoose';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findAll(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.findAllByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @UserId() userId: string) {
    console.log(`[ActivityController] findOne called for ID: "${id}" by user: ${userId}`);
    if (!userId) throw new UnauthorizedException('User ID required');
    if (id === 'undefined' || id === 'null' || !id) {
      console.warn(`[ActivityController] Rejected findOne call with invalid ID: "${id}"`);
      throw new BadRequestException('Activity ID is missing or invalid');
    }
    const activity = await this.activityService.findOne(id, userId);
    if (!activity) {
      console.warn(`[ActivityController] Activity not found for ID: "${id}"`);
    }
    return activity;
  }

  @Post()
  create(@Body() activityData: any, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.create({ ...activityData, user: userId });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.update(id, data, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.delete(id, userId);
  }
}
