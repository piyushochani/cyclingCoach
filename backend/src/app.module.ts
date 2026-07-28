import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { ActivityModule } from './activity/activity.module';
import { RaceModule } from './race/race.module';
import { StatsModule } from './stats/stats.module';
import { PlanModule } from './plan/plan.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { SyncModule } from './sync/sync.module';
import { StravaAuthModule } from './strava-auth/strava-auth.module';
import { BestEffortsModule } from './best-efforts/best-efforts.module';
import { ExpenseModule } from './expense/expense.module';
import { GearModule } from './gear/gear.module';
import { AnalysisModule } from './analysis/analysis.module';
import { TrainingContextModule } from './training-context/training-context.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { NotificationModule } from './notification/notification.module';
import { AgentModule } from './agent/agent.module';
import { GeminiStatusModule } from './gemini-status/gemini-status.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { QueueModule } from './common/queue/queue.module';
import { JobsModule } from './common/queue/jobs.module';
import { DummyPaymentModule } from './common/dummy-payment/dummy-payment.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    QueueModule.forRoot(),
    DatabaseModule,
    UserModule,
    ActivityModule,
    RaceModule,
    StatsModule,
    PlanModule,
    AuthModule,
    EmailModule,
    SyncModule,
    StravaAuthModule,
    BestEffortsModule,
    ExpenseModule,
    GearModule,
    AnalysisModule,
    TrainingContextModule,
    SubscriptionModule,
    NotificationModule,
    AgentModule,
    GeminiStatusModule,
    HealthModule,
    DummyPaymentModule,
    JobsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
