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
    const newPlan = new this.planModel(plan);
    return newPlan.save();
  }
}
