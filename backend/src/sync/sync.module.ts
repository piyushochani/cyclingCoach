import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { User, UserSchema } from '../user/user.schema';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncJobHandler, SyncMockProcessor } from './sync.processor';
import { SyncWorker } from './sync.worker';
import { SyncQueueService } from './sync-queue.service';
import { AnalysisModule } from '../analysis/analysis.module';
import { NotificationModule } from '../notification/notification.module';
import { GearModule } from '../gear/gear.module';
import { TrainingContextModule } from '../training-context/training-context.module';
import { createQueueModule } from '../common/queue/conditional-queue';
import { isRedisEnabled } from '../common/queue/queue.constants';
import { QUEUES } from '../common/queue/queue.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    createQueueModule(QUEUES.SYNC),
    AnalysisModule,
    NotificationModule,
    GearModule,
    TrainingContextModule,
  ],
  controllers: [SyncController],
  providers: [
    SyncService,
    SyncQueueService,
    SyncJobHandler,
    ...(isRedisEnabled() ? [SyncWorker] : [SyncMockProcessor]),
  ],
  exports: [SyncService, SyncQueueService],
})
export class SyncModule {}
