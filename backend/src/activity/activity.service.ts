import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './activity.schema';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {}

  findAll(): Promise<Activity[]> {
    return this.activityModel.find().exec();
  }

  findAllByUserId(userId: any): Promise<Activity[]> {
    return this.activityModel.find({ user: userId as any }).exec();
  }

  create(activity: Partial<Activity>): Promise<Activity> {
    const newActivity = new this.activityModel(activity);
    return newActivity.save();
  }
}
