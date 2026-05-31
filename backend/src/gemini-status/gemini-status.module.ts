import { Module } from '@nestjs/common';
import { GeminiStatusController } from './gemini-status.controller';

@Module({
  controllers: [GeminiStatusController],
})
export class GeminiStatusModule {}
