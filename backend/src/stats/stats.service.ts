import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity } from '../activity/activity.schema';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {}

  async getAllStats() {
    const activities = await this.activityModel.find().exec();

    const totalDistance = activities.reduce((sum, act) => sum + act.distance, 0);
    const totalDuration = activities.reduce((sum, act) => sum + act.durationSeconds, 0);
    const totalElevation = activities.reduce((sum, act) => sum + act.elevationGain, 0);

    return {
      totalDistance,
      totalDuration,
      totalElevation,
      activityCount: activities.length,
    };
  }

  async getUserStats(userId: any) {
    const activities = await this.activityModel.find({ user: userId as any }).exec();

    const totalDistance = activities.reduce((sum, act) => sum + act.distance, 0);
    const totalDuration = activities.reduce((sum, act) => sum + act.durationSeconds, 0);
    const totalElevation = activities.reduce((sum, act) => sum + act.elevationGain, 0);

    return {
      totalDistance,
      totalDuration,
      totalElevation,
      activityCount: activities.length,
    };
  }
}
