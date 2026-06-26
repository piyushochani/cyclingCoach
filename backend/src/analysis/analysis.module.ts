import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AnalysisProcessor } from './analysis.processor';
import { ContextBuilderService } from './context-builder.service';
import { DataProcessorService } from './data-processor.service';
import { SummaryBuilderService } from './summary-builder.service';
import { PineconeClient } from './pinecone-client';
import { EmbeddingService } from './embedding.service';
import { ActivitySyncPipelineService } from './activity-sync-pipeline.service';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { User, UserSchema } from '../user/user.schema';
import { Race, RaceSchema } from '../race/race.schema';
import { NotificationModule } from '../notification/notification.module';
import { PlanModule } from '../plan/plan.module';
import { TrainingContextModule } from '../training-context/training-context.module';
import { createQueueModule } from '../common/queue/conditional-queue';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
      { name: Race.name, schema: RaceSchema },
    ]),
    createQueueModule('analysis'),
    NotificationModule,
    PlanModule,
    TrainingContextModule,
  ],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    AnalysisProcessor,
    ContextBuilderService,
    DataProcessorService,
    SummaryBuilderService,
    PineconeClient,
    EmbeddingService,
    ActivitySyncPipelineService,
  ],
  exports: [AnalysisService, ActivitySyncPipelineService, PineconeClient, EmbeddingService],
})
export class AnalysisModule {}
