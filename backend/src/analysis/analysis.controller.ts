import { Controller, Post, Body } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  async analyze(
    @Body() body: {
      type: 'daily' | 'weekly' | 'monthly' | 'chat';
      activities: any[];
      message?: string;
      previousActivities?: any[];
    },
    @UserId() userId: string,
  ) {
    return this.analysisService.analyze(body, userId);
  }

  @Post('generate-plan')
  async generatePlan(
    @Body() body: { activities: any[] },
    @UserId() userId: string,
  ) {
    return this.analysisService.generateNextWeekPlan(body.activities || [], userId);
  }
}
