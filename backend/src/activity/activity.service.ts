import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './activity.schema';
import { GearService } from '../gear/gear.service';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    private gearService: GearService,
  ) {}

  findAll(): Promise<Activity[]> {
    return this.activityModel.find().exec();
  }

  findAllByUserId(userId: any): Promise<Activity[]> {
    return this.activityModel.find({ user: userId as any }).exec();
  }

  async findOne(id: string, userId?: any): Promise<Activity | null> {
    const filter: any = { _id: id };
    if (userId) filter.user = userId as any;
    return this.activityModel.findOne(filter).exec();
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
