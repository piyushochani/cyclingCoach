import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { User, UserSchema } from '../user/user.schema';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
