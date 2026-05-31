import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './notification.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  async create(userId: string, type: string, title: string, message: string, metadata?: Record<string, any>): Promise<Notification> {
    return this.notificationModel.create({
      user: userId as any,
      type,
      title,
      message,
      metadata: metadata || {},
    });
  }

  async findByUser(userId: string, limit = 50, skip = 0): Promise<Notification[]> {
    return this.notificationModel
      .find({ user: userId as any })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: notificationId, user: userId as any },
      { $set: { read: true } },
    ).exec();
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { user: userId as any, read: false },
      { $set: { read: true } },
    ).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ user: userId as any, read: false }).exec();
  }

  async createActivitySynced(userId: string, activityName: string, activityId: string): Promise<Notification> {
    return this.create(userId, 'activity', 'Activity Synced', `${activityName} has been imported from Strava.`, { activityId });
  }

  async createBestEffortNotification(userId: string, effortName: string, value: string, activityId: string): Promise<Notification> {
    return this.create(userId, 'achievement', `New PR: ${effortName}`, `You set a new personal best of ${value}.`, { activityId, effortName });
  }

  async createSyncCompleteNotification(userId: string, count: number): Promise<Notification> {
    return this.create(userId, 'sync', 'Sync Complete', `${count} activities synced from Strava.`, { count });
  }

  async createRaceReminder(userId: string, raceName: string, raceId: string, daysAway: number): Promise<Notification> {
    const dayLabel = daysAway === 0 ? 'today' : `in ${daysAway} days`;
    return this.create(userId, 'reminder', `Race: ${raceName}`, `Your race "${raceName}" starts ${dayLabel}.`, { raceId, raceName, daysAway });
  }
}
