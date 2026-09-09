import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.schema';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { Race, RaceSchema } from '../race/race.schema';
import { TrainingPlan, TrainingPlanSchema } from '../plan/plan.schema';
import { Notification, NotificationSchema } from '../notification/notification.schema';
import { Subscription, SubscriptionSchema } from '../subscription/subscription.schema';
import { SyncModule } from '../sync/sync.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationModule } from '../notification/notification.module';
import { AdminAuditLog, AdminAuditLogSchema } from './admin-audit.schema';
import { AdminAuditService } from './admin-audit.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthController } from './admin-auth.controller';
import { AdminController, AdminUsersController } from './admin-users.controller';
import { AdminUserPasswordsController } from './admin-userpasswords.controller';
import { AdminSystemController, AdminNotificationsController, AdminAuditController } from './admin-system.controller';
import { AdminService, AdminUsersService } from './admin.service';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: AdminAuditLog.name, schema: AdminAuditLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Race.name, schema: RaceSchema },
      { name: TrainingPlan.name, schema: TrainingPlanSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    SyncModule,
    SubscriptionModule,
    NotificationModule,
  ],
  controllers: [
    AdminAuthController,
    AdminController,
    AdminUsersController,
    AdminSystemController,
    AdminNotificationsController,
    AdminAuditController,
    AdminUserPasswordsController,
  ],
  providers: [
    AdminAuthService,
    AdminAuthGuard,
    AdminAuditService,
    AdminService,
    AdminUsersService,
  ],
  exports: [AdminAuthGuard, AdminAuthService],
})
export class AdminModule {}
