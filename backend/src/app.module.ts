import { Module } from '@nestjs/common';
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
import { ChatQueryModule } from './chat-query/chat-query.module';
import { TrainingContextModule } from './training-context/training-context.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { NotificationModule } from './notification/notification.module';
import { AgentModule } from './agent/agent.module';
import { GeminiStatusModule } from './gemini-status/gemini-status.module';

@Module({
  imports: [DatabaseModule, UserModule, ActivityModule, RaceModule, StatsModule, PlanModule, AuthModule, EmailModule, SyncModule, StravaAuthModule, BestEffortsModule, ExpenseModule, GearModule, AnalysisModule, TrainingContextModule, SubscriptionModule, ChatQueryModule, NotificationModule, AgentModule, GeminiStatusModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
