import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription } from './subscription.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
  ) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionModel.findOne({ user: userId as any }).exec();
  }

  async getStatus(userId: string): Promise<{ tier: string; status: string; endDate: Date | null; cancelAtPeriodEnd: boolean }> {
    const sub = await this.findByUserId(userId);
    if (!sub) {
      return { tier: 'free', status: 'active', endDate: null, cancelAtPeriodEnd: false };
    }
    return {
      tier: sub.tier,
      status: sub.status,
      endDate: sub.endDate,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }

  async getRenewalStatus(userId: string): Promise<{ daysUntilExpiry: number; tier: string; status: string }> {
    const sub = await this.findByUserId(userId);
    if (!sub || !sub.endDate) {
      return { daysUntilExpiry: -1, tier: 'free', status: 'active' };
    }
    const now = new Date();
    const end = new Date(sub.endDate);
    const diffTime = end.getTime() - now.getTime();
    const daysUntilExpiry = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return { daysUntilExpiry, tier: sub.tier, status: sub.status };
  }

  async createOrUpdate(userId: string, data: Partial<Subscription>): Promise<Subscription> {
    return this.subscriptionModel.findOneAndUpdate(
      { user: userId as any },
      { $set: data },
      { upsert: true, returnDocument: 'after' },
    ).exec();
  }

  async cancel(userId: string): Promise<Subscription | null> {
    const sub = await this.findByUserId(userId);
    if (!sub) throw new NotFoundException('No subscription found');
    sub.cancelAtPeriodEnd = true;
    sub.status = 'canceled';
    return sub.save();
  }

  async reactivate(userId: string): Promise<Subscription | null> {
    const sub = await this.findByUserId(userId);
    if (!sub) throw new NotFoundException('No subscription found');
    sub.cancelAtPeriodEnd = false;
    sub.status = 'active';
    return sub.save();
  }
}
