import { Module } from '@nestjs/common';
import { GeminiStatusController } from './gemini-status.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [GeminiStatusController],
})
export class GeminiStatusModule {}
