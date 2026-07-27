import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrainingPlan, TrainingPlanSchema } from './plan.schema';
import { ModelChangeRecommendation, ModelChangeRecommendationSchema } from './model-change.schema';
import { PlanService } from './plan.service';
import { ModelChangeService } from './model-change.service';
import { PlanController } from './plan.controller';
import { ModelChangeController } from './model-change.controller';
import { PlanJobHandler, PlanMockProcessor } from './plan.processor';
import { PlanWorker } from './plan.worker';
import { PlanQueueService } from './plan-queue.service';
import { AnalysisModule } from '../analysis/analysis.module';
import { createQueueModule } from '../common/queue/conditional-queue';
import { isRedisEnabled, QUEUES } from '../common/queue/queue.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrainingPlan.name, schema: TrainingPlanSchema },
      { name: ModelChangeRecommendation.name, schema: ModelChangeRecommendationSchema },
    ]),
    createQueueModule(QUEUES.PLAN),
    forwardRef(() => AnalysisModule),
  ],
  controllers: [PlanController, ModelChangeController],
  providers: [
    PlanService,
    ModelChangeService,
    PlanQueueService,
    PlanJobHandler,
    ...(isRedisEnabled() ? [PlanWorker] : [PlanMockProcessor]),
  ],
  exports: [PlanService, ModelChangeService, PlanQueueService],
})
export class PlanModule {}
