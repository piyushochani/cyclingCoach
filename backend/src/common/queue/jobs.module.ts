import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { createQueueModule } from './conditional-queue';

@Module({
  imports: [
    createQueueModule('sync'),
    createQueueModule('analysis'),
    createQueueModule('plan'),
  ],
  controllers: [JobsController],
})
export class JobsModule {}
