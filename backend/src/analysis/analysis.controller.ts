import { Controller, Post, Body } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  async analyze(@Body() body: {
    type: 'daily' | 'weekly' | 'monthly' | 'chat';
    activities: any[];
    message?: string;
    previousActivities?: any[];
  }) {
    return this.analysisService.analyze(body);
  }
}
