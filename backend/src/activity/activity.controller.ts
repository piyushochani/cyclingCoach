import { Controller, Get, Post, Put, Delete, Param, Body, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { ActivityService } from './activity.service';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findAll(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.findAllByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.activityService.findOne(id, userId);
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
