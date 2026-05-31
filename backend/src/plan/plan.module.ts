import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrainingPlan, TrainingPlanSchema } from './plan.schema';
import { ModelChangeRecommendation, ModelChangeRecommendationSchema } from './model-change.schema';
import { PlanService } from './plan.service';
import { ModelChangeService } from './model-change.service';
import { PlanController } from './plan.controller';
import { ModelChangeController } from './model-change.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrainingPlan.name, schema: TrainingPlanSchema },
      { name: ModelChangeRecommendation.name, schema: ModelChangeRecommendationSchema },
    ]),
  ],
  controllers: [PlanController, ModelChangeController],
  providers: [PlanService, ModelChangeService],
  exports: [PlanService, ModelChangeService],
})
export class PlanModule {}
