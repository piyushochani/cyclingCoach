import { Controller, Get, Query } from '@nestjs/common';
import { getAllKeyStatuses, validateGeminiKey } from '../common/gemini-key-validator';

@Controller('gemini')
export class GeminiStatusController {
  @Get('status')
  async getStatus() {
    const keys = await getAllKeyStatuses();
    const total = keys.length;
    const valid = keys.filter((k) => k.valid).length;
    const exhausted = keys.filter((k) => k.exhausted).length;
    const invalid = keys.filter((k) => !k.valid).length;

    return {
      checkedAt: new Date().toISOString(),
      summary: { total, valid, exhausted, invalid },
      keys,
    };
  }

  @Get('check-key')
  async checkKey(@Query('key') key: string) {
    if (!key) return { error: 'Query param "key" is required' };
    const result = await validateGeminiKey(key);
    return { keyMasked: key.slice(0, 4) + '****' + key.slice(-4), ...result };
  }
}
