import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TrainingPlan } from './plan.schema';

@Injectable()
export class PlanService {
  constructor(
    @InjectModel(TrainingPlan.name) private planModel: Model<TrainingPlan>,
  ) {}

  findAll(): Promise<TrainingPlan[]> {
    return this.planModel.find().exec();
  }

  findAllByUserId(userId: any): Promise<TrainingPlan[]> {
    return this.planModel.find({ user: userId as any }).exec();
  }

  create(plan: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const newPlan = new this.planModel({
      ...plan,
      generatedAt: new Date(),
      lastUpdatedAt: new Date(),
    });
    return newPlan.save();
  }

  async update(
    id: string,
    updates: Partial<TrainingPlan>,
  ): Promise<TrainingPlan | null> {
    return this.planModel.findByIdAndUpdate(
      id,
      { ...updates, lastUpdatedAt: new Date() },
      { returnDocument: 'after' },
    ).exec();
  }

  async appendRenderedWeek(
    planId: string,
    renderedWeek: Record<string, any>,
  ): Promise<TrainingPlan | null> {
    return this.planModel.findByIdAndUpdate(
      planId,
      {
        $push: { renderedWeeklyPlans: renderedWeek },
        $set: { lastUpdatedAt: new Date() },
      },
      { returnDocument: 'after' },
    ).exec();
  }

  async addModelChangeEntry(
    planId: string,
    entry: Record<string, any>,
  ): Promise<TrainingPlan | null> {
    return this.planModel.findByIdAndUpdate(
      planId,
      {
        $push: { modelChangeHistory: { ...entry, timestamp: new Date() } },
        $set: { lastUpdatedAt: new Date() },
      },
      { returnDocument: 'after' },
    ).exec();
  }
}
