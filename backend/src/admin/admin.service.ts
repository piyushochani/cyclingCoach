import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { Activity } from '../activity/activity.schema';
import { Race } from '../race/race.schema';
import { TrainingPlan } from '../plan/plan.schema';
import { Notification } from '../notification/notification.schema';
import { Subscription } from '../subscription/subscription.schema';
import { getAllKeyStatuses } from '../common/gemini-key-validator';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';

function objectIdCreatedAt(id: Types.ObjectId): Date {
  return id.getTimestamp();
}

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const staleSyncCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      freeUsers,
      proUsers,
      stravaConnected,
      totalActivities,
      staleSyncUsers,
      subscriptionCounts,
      geminiKeys,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ subscriptionTier: 'free' }).exec(),
      this.userModel.countDocuments({ subscriptionTier: 'pro' }).exec(),
      this.userModel.countDocuments({ lastSyncAt: { $ne: null } }).exec(),
      this.activityModel.countDocuments().exec(),
      this.userModel.countDocuments({
        lastSyncAt: { $lt: staleSyncCutoff },
        autoSyncEnabled: true,
      }).exec(),
      this.subscriptionModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).exec(),
      getAllKeyStatuses(),
    ]);

    const allUsers = await this.userModel.find().select('_id').lean().exec();
    const signups7d = allUsers.filter((u) => objectIdCreatedAt(u._id as Types.ObjectId) >= sevenDaysAgo).length;
    const signups30d = allUsers.filter((u) => objectIdCreatedAt(u._id as Types.ObjectId) >= thirtyDaysAgo).length;

    const geminiSummary = {
      total: geminiKeys.length,
      valid: geminiKeys.filter((k) => k.valid).length,
      exhausted: geminiKeys.filter((k) => k.exhausted).length,
      invalid: geminiKeys.filter((k) => !k.valid).length,
    };

    const subscriptions: Record<string, number> = {};
    for (const row of subscriptionCounts) {
      subscriptions[row._id] = row.count;
    }

    return {
      checkedAt: now.toISOString(),
      users: {
        total: totalUsers,
        signups7d,
        signups30d,
        free: freeUsers,
        pro: proUsers,
        stravaConnected,
        staleSync: staleSyncUsers,
      },
      activities: { total: totalActivities },
      subscriptions,
      gemini: geminiSummary,
    };
  }
}

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Race.name) private raceModel: Model<Race>,
    @InjectModel(TrainingPlan.name) private planModel: Model<TrainingPlan>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
  ) {}

  async listUsers(query: AdminUserQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.tier) filter.subscriptionTier = query.tier;
    if (query.search) {
      const regex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { email: regex },
        { firstName: regex },
        { lastName: regex },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-passwordHash')
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      users: users.map((u) => ({
        ...u,
        createdAt: objectIdCreatedAt(u._id as Types.ObjectId).toISOString(),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel
      .findById(userId)
      .select('-passwordHash')
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');

    const [activityCount, raceCount, planCount, notificationCount, subscription] =
      await Promise.all([
        this.activityModel.countDocuments({ user: userId as any }).exec(),
        this.raceModel.countDocuments({ user: userId as any }).exec(),
        this.planModel.countDocuments({ user: userId as any }).exec(),
        this.notificationModel.countDocuments({ user: userId as any }).exec(),
        this.subscriptionModel.findOne({ user: userId as any }).lean().exec(),
      ]);

    return {
      user: {
        ...user,
        createdAt: objectIdCreatedAt(user._id as Types.ObjectId).toISOString(),
      },
      counts: {
        activities: activityCount,
        races: raceCount,
        plans: planCount,
        notifications: notificationCount,
      },
      subscription: subscription || { tier: user.subscriptionTier, status: 'active' },
    };
  }
}
