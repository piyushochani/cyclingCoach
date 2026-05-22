import { Controller, Get, Post, Body } from '@nestjs/common';
import { PlanService } from './plan.service';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  findAll() {
    return this.planService.findAll();
  }

  @Post()
  create(@Body() planData: any) {
    return this.planService.create(planData);
  }
}
