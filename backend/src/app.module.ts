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
import { TrainingContextModule } from './training-context/training-context.module';

@Module({
  imports: [DatabaseModule, UserModule, ActivityModule, RaceModule, StatsModule, PlanModule, AuthModule, EmailModule, SyncModule, StravaAuthModule, BestEffortsModule, ExpenseModule, GearModule, AnalysisModule, TrainingContextModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
