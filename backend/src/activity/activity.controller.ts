import { Controller, Get, Post, Body } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findAll() {
    return this.activityService.findAll();
  }

  @Post()
  create(@Body() activityData: any) {
    return this.activityService.create(activityData);
  }
}
