import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../common/public.decorator';
import { getAllKeyStatuses, validateGeminiKey } from '../common/gemini-key-validator';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminUser } from './admin-user.decorator';
import { AdminAuditService } from './admin-audit.service';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Public()
@UseGuards(AdminAuthGuard)
@Controller('admin/system')
export class AdminSystemController {
  constructor(
    @InjectConnection() private connection: Connection,
    private readonly auditService: AdminAuditService,
    private readonly notificationService: NotificationService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Get('health')
  async getHealth() {
    let mongoStatus = 'disconnected';
    try {
      mongoStatus = this.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch {
      mongoStatus = 'error';
    }

    return {
      ok: true,
      checkedAt: new Date().toISOString(),
      mongo: mongoStatus,
      redis: process.env.REDIS_ENABLED !== 'false' ? 'enabled' : 'disabled (mock queue)',
      llmProvider: process.env.LLM_PROVIDER || 'auto',
      llmModel: process.env.GOOGLE_LLM_MODEL || process.env.GROQ_CHAT_MODEL || 'default',
      stravaConfigured: !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET),
    };
  }

  @Get('gemini')
  async getGeminiStatus() {
    const keys = await getAllKeyStatuses();
    const total = keys.length;
    const valid = keys.filter((k) => k.valid).length;
    const exhausted = keys.filter((k) => k.exhausted).length;
    const invalid = keys.filter((k) => !k.valid).length;

    return {
      checkedAt: new Date().toISOString(),
      summary: { total, valid, exhausted, invalid },
      keys,
    };
  }

  @Get('gemini/check-key')
  async checkGeminiKey(@Query('key') key: string) {
    if (!key) return { error: 'Query param "key" is required' };
    const result = await validateGeminiKey(key);
    return { keyMasked: key.slice(0, 4) + '****' + key.slice(-4), ...result };
  }
}

@Public()
@UseGuards(AdminAuthGuard)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly auditService: AdminAuditService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Post('broadcast')
  async broadcast(
    @Body() body: BroadcastNotificationDto,
    @AdminUser() admin: { username: string },
  ) {
    const filter: Record<string, any> = {};
    if (body.segment === 'pro') filter.subscriptionTier = 'pro';
    if (body.segment === 'free') filter.subscriptionTier = 'free';

    const users = await this.userModel.find(filter).select('_id').lean().exec();
    let sent = 0;

    for (const user of users) {
      await this.notificationService.create(
        String(user._id),
        'system',
        body.title,
        body.message,
        { broadcast: true, segment: body.segment || 'all' },
      );
      sent++;
    }

    await this.auditService.log(admin.username, 'broadcast_notification', 'segment', body.segment || 'all', {
      title: body.title,
      sent,
    });

    return { message: 'Broadcast sent', sent };
  }
}

@Public()
@UseGuards(AdminAuthGuard)
@Controller('admin/audit-log')
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  getAuditLog(@Query('limit') limit?: string, @Query('skip') skip?: string) {
    return this.auditService.findRecent(
      limit ? parseInt(limit, 10) : 50,
      skip ? parseInt(skip, 10) : 0,
    );
  }
}
