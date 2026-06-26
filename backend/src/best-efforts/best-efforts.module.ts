import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BestEffortRecord, BestEffortRecordSchema, Segment, SegmentSchema, SegmentEffort, SegmentEffortSchema, BestEffortsSyncStatus, BestEffortsSyncStatusSchema } from './best-efforts.schema';
import { BestEffortsService } from './best-efforts.service';
import { BestEffortsController } from './best-efforts.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BestEffortRecord.name, schema: BestEffortRecordSchema },
      { name: Segment.name, schema: SegmentSchema },
      { name: SegmentEffort.name, schema: SegmentEffortSchema },
      { name: BestEffortsSyncStatus.name, schema: BestEffortsSyncStatusSchema },
    ]),
    NotificationModule,
  ],
  controllers: [BestEffortsController],
  providers: [BestEffortsService],
})
export class BestEffortsModule {}
