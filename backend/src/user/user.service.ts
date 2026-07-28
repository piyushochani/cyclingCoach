import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { isSubscriptionSwitchEnabled, resolveEffectiveTier } from '../common/subscription-config';
import { User } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  private toPublicUser(user: User | Record<string, any> | null): User | null {
    if (!user) return null;
    const obj = typeof (user as User).toObject === 'function'
      ? (user as User).toObject()
      : { ...user };
    delete (obj as any).passwordHash;
    (obj as any).subscriptionTier = resolveEffectiveTier((obj as any).subscriptionTier);
    (obj as any).subscriptionSwitch = isSubscriptionSwitchEnabled();
    return obj as User;
  }

  async findOne(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).select('-passwordHash').exec();
    return this.toPublicUser(user);
  }

  async create(user: Partial<User>): Promise<User> {
    if (user.passwordHash) {
      user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
    }
    const newUser = new this.userModel(user);
    const saved = await newUser.save();
    const obj = saved.toObject();
    delete (obj as any).passwordHash;
    return obj as User;
  }

  async update(email: string, data: Partial<User>): Promise<User | null> {
    const allowed = ['firstName', 'lastName', 'mainSport', 'experienceLevel', 'heightCm', 'weightKg', 'goal', 'cyclingYears', 'ftp', 'maxHeartrate', 'age', 'profileImage', 'description', 'coaches', 'stravaUpdatedAt', 'isStravaUpToDate', 'trainingStart', 'onboardingSummary', 'telegramChatId', 'weeklyGoalKm', 'selectedCoach', 'customCoaches', 'autoSyncEnabled'];
    const update: Record<string, any> = {};
    const d = data as Record<string, any>;
    for (const key of allowed) {
      if (d[key] !== undefined) update[key] = d[key];
    }
    const updated = await this.userModel
      .findOneAndUpdate({ email }, update, { returnDocument: 'after' })
      .select('-passwordHash')
      .exec();
    return this.toPublicUser(updated);
  }
}
