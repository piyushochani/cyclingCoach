import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity } from './activity.schema';
import { GearService } from '../gear/gear.service';

const CYCLING_FILTER = { sport: { $regex: /ride|cycling|bike|bicycle|velomobile|handcycle/i } };

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    private gearService: GearService,
  ) {}

  findAll(): Promise<Activity[]> {
    return this.activityModel.find(CYCLING_FILTER).exec();
  }

  findAllByUserId(userId: any): Promise<Activity[]> {
    return this.activityModel.find({ ...CYCLING_FILTER, user: userId as any }).exec();
  }

  async findOne(id: string, userId?: any): Promise<Activity | null> {
    const userIdFilter = userId ? { user: userId as any } : {};
    
    // 1. Try finding by MongoDB _id
    if (Types.ObjectId.isValid(id)) {
      const act = await this.activityModel.findOne({ _id: id, ...userIdFilter }).exec();
      if (act) return act;
    }

    // 2. Fallback: Try finding by Strava ID (if the id is numeric)
    const stravaId = parseInt(id, 10);
    if (!isNaN(stravaId)) {
      return this.activityModel.findOne({ stravaId, ...userIdFilter }).exec();
    }

    return null;
  }

  async create(activity: Partial<Activity>): Promise<Activity> {
    const newActivity = new this.activityModel(activity);
    const saved = await newActivity.save();
    if (activity.distance && activity.distance > 0) {
      try {
        await this.gearService.addDistanceToActiveBike(activity.distance, activity.user);
      } catch {}
    }
    return saved;
  }

  async update(id: string, data: Partial<Activity>, userId?: any): Promise<Activity | null> {
    const filter: any = { _id: id };
    if (userId) filter.user = userId as any;
    return this.activityModel.findOneAndUpdate(filter, data, { returnDocument: 'after' }).exec();
  }

  async delete(id: string, userId?: any): Promise<Activity | null> {
    const filter: any = { _id: id };
    if (userId) filter.user = userId as any;
    return this.activityModel.findOneAndDelete(filter).exec();
  }
}
