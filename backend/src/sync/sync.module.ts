import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { User, UserSchema } from '../user/user.schema';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncProcessor } from './sync.processor';
import { AnalysisModule } from '../analysis/analysis.module';
import { NotificationModule } from '../notification/notification.module';
import { GearModule } from '../gear/gear.module';
import { TrainingContextModule } from '../training-context/training-context.module';
import { createQueueModule } from '../common/queue/conditional-queue';
import { StravaAuthModule } from '../strava-auth/strava-auth.module';

@Module({
  imports: [
    StravaAuthModule,
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    createQueueModule('sync'),
    AnalysisModule,
    NotificationModule,
    GearModule,
    TrainingContextModule,
  ],
  controllers: [SyncController],
  providers: [SyncService, SyncProcessor],
  exports: [SyncService],
})
export class SyncModule {}
