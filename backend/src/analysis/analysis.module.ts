import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ContextBuilderService } from './context-builder.service';
import { DataProcessorService } from './data-processor.service';
import { SummaryBuilderService } from './summary-builder.service';
import { PineconeClient } from './pinecone-client';
import { EmbeddingService } from './embedding.service';
import { ActivitySyncPipelineService } from './activity-sync-pipeline.service';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { User, UserSchema } from '../user/user.schema';
import { NotificationModule } from '../notification/notification.module';
import { PlanModule } from '../plan/plan.module';
import { TrainingContextModule } from '../training-context/training-context.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationModule,
    PlanModule,
    forwardRef(() => TrainingContextModule),
  ],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
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
