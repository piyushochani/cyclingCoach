import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonthContext } from './month-context.schema';
import { WeekContext } from './week-context.schema';
import { PreRaceWeekPlan } from './pre-race-week-plan.schema';
import { WeeklyPlan } from './weekly-plan.schema';
import { User } from '../user/user.schema';

@Injectable()
export class TrainingContextService {
  constructor(
    @InjectModel(MonthContext.name) private monthContextModel: Model<MonthContext>,
    @InjectModel(WeekContext.name) private weekContextModel: Model<WeekContext>,
    @InjectModel(PreRaceWeekPlan.name) private preRaceWeekPlanModel: Model<PreRaceWeekPlan>,
    @InjectModel(WeeklyPlan.name) private weeklyPlanModel: Model<WeeklyPlan>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  private async getTrainingStart(userId: string): Promise<Date> {
    try {
      const user = await this.userModel.findById(userId).select('trainingStart').lean().exec();
      if (user?.trainingStart) return new Date(user.trainingStart);
    } catch {}
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  }

  private getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  private computeRelativeWeek(targetDate: Date, trainingStart: Date): number {
    const targetMonday = this.getMondayOfWeek(targetDate);
    const startMonday = this.getMondayOfWeek(trainingStart);
    const diffMs = targetMonday.getTime() - startMonday.getTime();
    return Math.round(diffMs / (7 * 86400000));
  }

  // ── Month Context (last 2 months, rotating) ──

  async getMonthContexts(userId: string): Promise<MonthContext[]> {
    return this.monthContextModel.find({ user: userId as any })
      .sort({ year: -1, month: -1 })
      .limit(2)
      .lean()
      .exec();
  }

  async upsertMonthContext(userId: string, year: number, month: number, data: Partial<MonthContext>): Promise<MonthContext> {
    return this.monthContextModel.findOneAndUpdate(
      { user: userId as any, year, month },
      { ...data, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' },
    ).exec();
  }

  async deleteOldMonthContexts(userId: string): Promise<void> {
    const kept = await this.monthContextModel.find({ user: userId as any })
      .sort({ year: -1, month: -1 })
      .limit(2)
      .select('_id')
      .lean()
      .exec();
    const keptIds = kept.map(k => k._id);
    await this.monthContextModel.deleteMany({
      user: userId as any,
      _id: { $nin: keptIds },
    }).exec();
  }

  // ── Week Context (last 2 weeks, rotating) ──

  async getWeekContexts(userId: string): Promise<WeekContext[]> {
    return this.weekContextModel.find({ user: userId as any })
      .sort({ year: -1, week: -1 })
      .limit(2)
      .lean()
      .exec();
  }

  async upsertWeekContext(userId: string, year: number, week: number, data: Partial<WeekContext>): Promise<WeekContext> {
    return this.weekContextModel.findOneAndUpdate(
      { user: userId as any, year, week },
      { ...data, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' },
    ).exec();
  }

  async deleteOldWeekContexts(userId: string): Promise<void> {
    const kept = await this.weekContextModel.find({ user: userId as any })
      .sort({ year: -1, week: -1 })
      .limit(2)
      .select('_id')
      .lean()
      .exec();
    const keptIds = kept.map(k => k._id);
    await this.weekContextModel.deleteMany({
      user: userId as any,
      _id: { $nin: keptIds },
    }).exec();
  }

  // ── Pre-Race Week Plans (fixed per race) ──

  async getPreRacePlans(raceId: string, userId: string): Promise<PreRaceWeekPlan[]> {
    return this.preRaceWeekPlanModel.find({
      race: raceId as any,
      user: userId as any,
    }).sort({ weekOffset: 1 }).lean().exec();
  }

  async upsertPreRacePlan(raceId: string, userId: string, weekOffset: number, data: any): Promise<PreRaceWeekPlan> {
    return this.preRaceWeekPlanModel.findOneAndUpdate(
      { race: raceId as any, user: userId as any, weekOffset },
      { ...data, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' },
    ).exec();
  }

  async deletePreRacePlan(raceId: string, userId: string, weekOffset: number): Promise<boolean> {
    const result = await this.preRaceWeekPlanModel.findOneAndDelete({
      race: raceId as any,
      user: userId as any,
      weekOffset,
    }).exec();
    return !!result;
  }

  // ── Weekly Plan (this week's training) ──

  async getWeeklyPlan(userId: string, relativeWeek: number): Promise<WeeklyPlan | null> {
    return this.weeklyPlanModel.findOne({
      user: userId as any,
      relativeWeek,
    }).lean().exec();
  }

  async getCurrentWeekPlan(userId: string): Promise<WeeklyPlan | null> {
    const trainingStart = await this.getTrainingStart(userId);
    const relativeWeek = this.computeRelativeWeek(new Date(), trainingStart);
    return this.getWeeklyPlan(userId, relativeWeek);
  }

  async upsertWeeklyPlan(userId: string, relativeWeek: number, data: any): Promise<WeeklyPlan> {
    const trainingStart = await this.getTrainingStart(userId);
    const targetDate = new Date(trainingStart);
    targetDate.setDate(targetDate.getDate() + relativeWeek * 7);
    const startDate = this.getMondayOfWeek(targetDate);
    const { year, week } = this.getCalendarWeek(startDate);
    return this.weeklyPlanModel.findOneAndUpdate(
      { user: userId as any, relativeWeek },
      { ...data, year, week, startDate, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' },
    ).exec();
  }

  async upsertWeeklyPlanWithSkeleton(
    userId: string,
    relativeWeek: number,
    data: any,
    skeleton: Record<string, any>,
  ): Promise<WeeklyPlan> {
    const trainingStart = await this.getTrainingStart(userId);
    const targetDate = new Date(trainingStart);
    targetDate.setDate(targetDate.getDate() + relativeWeek * 7);
    const startDate = this.getMondayOfWeek(targetDate);
    const { year, week } = this.getCalendarWeek(startDate);
    return this.weeklyPlanModel.findOneAndUpdate(
      { user: userId as any, relativeWeek },
      { ...data, year, week, startDate, skeleton, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' },
    ).exec();
  }

  async findAllWeeklyPlans(userId: string): Promise<WeeklyPlan[]> {
    return this.weeklyPlanModel.find({ user: userId as any })
      .sort({ year: -1, week: -1 })
      .lean()
      .exec();
  }

  async deleteWeeklyPlan(userId: string, relativeWeek: number): Promise<boolean> {
    const result = await this.weeklyPlanModel.findOneAndDelete({
      user: userId as any,
      relativeWeek,
    }).exec();
    return !!result;
  }

  private getCalendarWeek(date: Date): { year: number; week: number } {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return { year: date.getFullYear(), week };
  }
}
