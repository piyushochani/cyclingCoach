import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { User, UserSchema } from '../user/user.schema';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
