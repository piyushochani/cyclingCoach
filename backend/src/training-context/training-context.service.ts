import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonthContext } from './month-context.schema';
import { WeekContext } from './week-context.schema';
import { PreRaceWeekPlan } from './pre-race-week-plan.schema';
import { WeeklyPlan } from './weekly-plan.schema';

@Injectable()
export class TrainingContextService {
  constructor(
    @InjectModel(MonthContext.name) private monthContextModel: Model<MonthContext>,
    @InjectModel(WeekContext.name) private weekContextModel: Model<WeekContext>,
    @InjectModel(PreRaceWeekPlan.name) private preRaceWeekPlanModel: Model<PreRaceWeekPlan>,
    @InjectModel(WeeklyPlan.name) private weeklyPlanModel: Model<WeeklyPlan>,
  ) {}

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
      { upsert: true, new: true },
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
      { upsert: true, new: true },
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
      { upsert: true, new: true },
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

  async getWeeklyPlan(userId: string, year: number, week: number): Promise<WeeklyPlan | null> {
    return this.weeklyPlanModel.findOne({
      user: userId as any,
      year,
      week,
    }).lean().exec();
  }

  async getCurrentWeekPlan(userId: string): Promise<WeeklyPlan | null> {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return this.getWeeklyPlan(userId, now.getFullYear(), week);
  }

  async upsertWeeklyPlan(userId: string, year: number, week: number, data: any): Promise<WeeklyPlan> {
    return this.weeklyPlanModel.findOneAndUpdate(
      { user: userId as any, year, week },
      { ...data, updatedAt: new Date() },
      { upsert: true, new: true },
    ).exec();
  }

  async deleteWeeklyPlan(userId: string, year: number, week: number): Promise<boolean> {
    const result = await this.weeklyPlanModel.findOneAndDelete({
      user: userId as any,
      year,
      week,
    }).exec();
    return !!result;
  }
}
