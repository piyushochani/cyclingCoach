import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Public } from '../common/public.decorator';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminUser } from './admin-user.decorator';
import { AdminService, AdminUsersService } from './admin.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { AdminAuditService } from './admin-audit.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { SyncService } from '../sync/sync.service';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/user.schema';

@Public()
@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }
}

@Public()
@UseGuards(AdminAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly auditService: AdminAuditService,
    private readonly subscriptionService: SubscriptionService,
    private readonly syncService: SyncService,
    private readonly notificationService: NotificationService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Get()
  listUsers(@Query() query: AdminUserQueryDto) {
    return this.adminUsersService.listUsers(query);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.adminUsersService.getUserDetail(id);
  }

  @Patch(':id/subscription')
  async updateSubscription(
    @Param('id') id: string,
    @Body() body: UpdateSubscriptionDto,
    @AdminUser() admin: { username: string },
  ) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    const previousTier = user.subscriptionTier;
    user.subscriptionTier = body.tier;
    if (body.tier === 'pro') {
      user.subscriptionStartDate = user.subscriptionStartDate || new Date();
    }
    await user.save();

    await this.subscriptionService.createOrUpdate(id, {
      tier: body.tier,
      status: 'active',
      startDate: body.tier === 'pro' ? new Date() : undefined,
    } as any);

    await this.auditService.log(admin.username, 'subscription_change', 'user', id, {
      from: previousTier,
      to: body.tier,
    });

    return { message: 'Subscription updated', tier: body.tier };
  }

  @Patch(':id/auto-sync')
  async toggleAutoSync(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
    @AdminUser() admin: { username: string },
  ) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { autoSyncEnabled: body.enabled },
      { returnDocument: 'after' },
    ).select('-passwordHash').exec();

    if (!user) throw new NotFoundException('User not found');

    await this.auditService.log(admin.username, 'auto_sync_toggle', 'user', id, {
      enabled: body.enabled,
    });

    return { autoSyncEnabled: user.autoSyncEnabled };
  }

  @Post(':id/sync')
  async triggerSync(
    @Param('id') id: string,
    @AdminUser() admin: { username: string },
  ) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    await this.auditService.log(admin.username, 'sync_trigger', 'user', id, { type: 'full' });

    const result = await this.syncService.fullSync(id);
    return result;
  }

  @Post(':id/sync/incremental')
  async triggerIncrementalSync(
    @Param('id') id: string,
    @AdminUser() admin: { username: string },
  ) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    await this.auditService.log(admin.username, 'sync_trigger', 'user', id, { type: 'incremental' });

    const result = await this.syncService.incrementalSync(id);
    return result;
  }

  @Post(':id/notification')
  async sendNotification(
    @Param('id') id: string,
    @Body() body: SendNotificationDto,
    @AdminUser() admin: { username: string },
  ) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    const notification = await this.notificationService.create(
      id,
      'system',
      body.title,
      body.message,
    );

    await this.auditService.log(admin.username, 'notification_send', 'user', id, {
      title: body.title,
    });

    return notification;
  }
}
