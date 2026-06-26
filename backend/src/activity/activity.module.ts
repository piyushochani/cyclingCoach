import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './activity.schema';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { GearModule } from '../gear/gear.module';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Activity.name, schema: ActivitySchema }]), GearModule, AnalysisModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
