import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription } from './subscription.schema';
import { DummyPaymentService } from '../common/dummy-payment/dummy-payment.service';
import { User } from '../user/user.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly dummyPaymentService: DummyPaymentService,
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

  async purchase(userId: string, planId: string, cardNumber: string, expiry: string, cvc: string): Promise<any> {
    if (!userId) throw new BadRequestException('User ID required');

    this.dummyPaymentService.validateCard(cardNumber, expiry, cvc);

    const now = new Date();
    const endDate = new Date(now);
    if (planId === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    await this.createOrUpdate(userId, {
      tier: 'pro',
      status: 'active',
      startDate: now,
      endDate,
      cancelAtPeriodEnd: false,
    } as any);

    await this.userModel.findByIdAndUpdate(userId, {
      subscriptionTier: 'pro',
      subscriptionStartDate: now,
      subscriptionEndDate: endDate,
    }).exec();

    return {
      success: true,
      tier: 'pro',
      endDate,
    };
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
