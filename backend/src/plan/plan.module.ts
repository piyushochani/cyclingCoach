import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrainingPlan, TrainingPlanSchema } from './plan.schema';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: TrainingPlan.name, schema: TrainingPlanSchema }])],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
