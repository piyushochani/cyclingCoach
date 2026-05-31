import { Controller, Get, Post, Param, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    const notifications = await this.notificationService.findByUser(userId);
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    return { notifications, unreadCount };
  }

  @Post(':id/read')
  async markRead(@UserId() userId: string, @Param('id') id: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    await this.notificationService.markRead(userId, id);
    return { success: true };
  }

  @Post('read-all')
  async markAllRead(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    await this.notificationService.markAllRead(userId);
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    return { success: true, unreadCount };
  }

  @Get('unread-count')
  async unreadCount(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    const count = await this.notificationService.getUnreadCount(userId);
    return { unreadCount: count };
  }
}
