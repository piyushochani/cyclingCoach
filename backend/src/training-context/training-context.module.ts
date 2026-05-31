import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonthContext, MonthContextSchema } from './month-context.schema';
import { WeekContext, WeekContextSchema } from './week-context.schema';
import { PreRaceWeekPlan, PreRaceWeekPlanSchema } from './pre-race-week-plan.schema';
import { WeeklyPlan, WeeklyPlanSchema } from './weekly-plan.schema';
import { User, UserSchema } from '../user/user.schema';
import { TrainingContextService } from './training-context.service';
import { TrainingContextController } from './training-context.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MonthContext.name, schema: MonthContextSchema },
      { name: WeekContext.name, schema: WeekContextSchema },
      { name: PreRaceWeekPlan.name, schema: PreRaceWeekPlanSchema },
      { name: WeeklyPlan.name, schema: WeeklyPlanSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TrainingContextController],
  providers: [TrainingContextService],
  exports: [TrainingContextService],
})
export class TrainingContextModule {}
