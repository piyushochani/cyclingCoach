import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BestEffortRecord, BestEffortRecordSchema, Segment, SegmentSchema, SegmentEffort, SegmentEffortSchema, BestEffortsSyncStatus, BestEffortsSyncStatusSchema } from './best-efforts.schema';
import { BestEffortsService } from './best-efforts.service';
import { BestEffortsController } from './best-efforts.controller';
import { BestEffortsJobHandler, BestEffortsMockProcessor } from './best-efforts.processor';
import { BestEffortsWorker } from './best-efforts.worker';
import { NotificationModule } from '../notification/notification.module';
import { createQueueModule } from '../common/queue/conditional-queue';
import { isRedisEnabled, QUEUES } from '../common/queue/queue.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BestEffortRecord.name, schema: BestEffortRecordSchema },
      { name: Segment.name, schema: SegmentSchema },
      { name: SegmentEffort.name, schema: SegmentEffortSchema },
      { name: BestEffortsSyncStatus.name, schema: BestEffortsSyncStatusSchema },
    ]),
    createQueueModule(QUEUES.BEST_EFFORTS),
    NotificationModule,
  ],
  controllers: [BestEffortsController],
  providers: [
    BestEffortsService,
    BestEffortsJobHandler,
    ...(isRedisEnabled() ? [BestEffortsWorker] : [BestEffortsMockProcessor]),
  ],
})
export class BestEffortsModule {}
