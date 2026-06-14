import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { FaqService } from './faq.service';

@Controller('agent')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get('faq-search')
  async searchFaq(
    @Query('q') query: string,
    @Query('k') k: string,
    @UserId() userId: string,
  ): Promise<{ results: any[] }> {
    if (!userId) throw new UnauthorizedException('User ID required');
    if (!query || !query.trim()) {
      return { results: [] };
    }
    const limit = Math.min(parseInt(k || '5', 10) || 5, 20);
    const results = await this.faqService.search(query.trim(), limit);
    return { results: results.map((r) => ({ chunk: r.chunk, score: r.score })) };
  }
}
