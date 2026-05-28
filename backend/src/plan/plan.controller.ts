import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { PlanService } from './plan.service';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  findAll(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.planService.findAllByUserId(userId);
  }

  @Post()
  create(@Body() planData: any, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.planService.create({ ...planData, user: userId });
  }
}
