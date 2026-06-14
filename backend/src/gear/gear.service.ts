import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bike, Equipment } from './gear.schema';

@Injectable()
export class GearService {
  private readonly logger = new Logger(GearService.name);

  constructor(
    @InjectModel(Bike.name) private bikeModel: Model<Bike>,
    @InjectModel(Equipment.name) private equipmentModel: Model<Equipment>,
  ) {}

  async findAllBikes(userId: any): Promise<Bike[]> {
    return this.bikeModel.find({ user: userId as any }).sort({ isActive: -1, createdAt: -1 }).exec();
  }

  async createBike(data: Partial<Bike>, userId: any): Promise<Bike> {
    if (data.isActive) {
      await this.bikeModel.updateMany({ user: userId as any }, { isActive: false }).exec();
    }
    const bike = new this.bikeModel({ ...data, user: userId });
    return bike.save();
  }

  async updateBike(id: string, data: Partial<Bike>, userId: any): Promise<Bike | null> {
    if (data.isActive) {
      await this.bikeModel.updateMany({ user: userId as any, _id: { $ne: id } }, { isActive: false }).exec();
    }
    return this.bikeModel.findOneAndUpdate({ _id: id, user: userId as any }, data, { returnDocument: 'after' }).exec();
  }

  async deleteBike(id: string, userId: any): Promise<Bike | null> {
    return this.bikeModel.findOneAndDelete({ _id: id, user: userId as any }).exec();
  }

  async addDistanceToActiveBike(distance: number, userId: any): Promise<void> {
    await this.bikeModel.updateOne(
      { user: userId as any, isActive: true },
      { $inc: { distanceUsed: distance } },
    ).exec();
  }

  async upsertBikeByStravaId(stravaId: string, data: { name?: string; distance?: number; isActive?: boolean }, userId: any): Promise<Bike> {
    const existing = await this.bikeModel.findOne({ stravaId, user: userId as any }).exec();
    if (existing) {
      const update: Record<string, any> = {};
      if (data.name) update.name = data.name;
      if (data.isActive !== undefined) update.isActive = data.isActive;
      if (data.distance) update.distanceUsed = Math.round(data.distance);
      await this.bikeModel.updateOne({ _id: existing._id }, { $set: update }).exec();
      if (data.isActive) {
        await this.bikeModel.updateMany({ user: userId as any, _id: { $ne: existing._id } }, { isActive: false }).exec();
      }
      return this.bikeModel.findById(existing._id).exec() as Promise<Bike>;
    }
    return this.createBike({ name: data.name || 'Unknown Bike', stravaId, distanceUsed: Math.round(data.distance || 0), isActive: data.isActive ?? false }, userId);
  }

  async findBikeByStravaId(stravaId: string, userId: any): Promise<Bike | null> {
    return this.bikeModel.findOne({ stravaId, user: userId as any }).exec();
  }

  async addDistanceToStravaBike(stravaId: string, distance: number, userId: any): Promise<void> {
    await this.bikeModel.updateOne(
      { stravaId, user: userId as any },
      { $inc: { distanceUsed: Math.round(distance) } },
    ).exec();
  }

  async syncBikesFromStrava(stravaBikes: { id: string; name: string; distance: number; primary: boolean }[], userId: any): Promise<number> {
    let count = 0;
    for (const sb of stravaBikes) {
      const existing = await this.bikeModel.findOne({ stravaId: sb.id, user: userId as any }).exec();
      if (existing) {
        const update: Record<string, any> = {};
        if (sb.name) update.name = sb.name;
        if (sb.primary !== undefined) update.isActive = sb.primary;
        if (Object.keys(update).length > 0) {
          await this.bikeModel.updateOne({ _id: existing._id }, { $set: update }).exec();
        }
        if (sb.primary) {
          await this.bikeModel.updateMany({ user: userId as any, _id: { $ne: existing._id } }, { isActive: false }).exec();
        }
      } else {
        await this.createBike({
          name: sb.name || 'Strava Bike',
          stravaId: sb.id,
          distanceUsed: Math.round(sb.distance || 0),
          isActive: sb.primary || false,
        }, userId);
      }
      count++;
    }
    this.logger.log(`Synced ${count} bikes from Strava for user ${userId}`);
    return count;
  }

  async findAllEquipment(userId: any): Promise<Equipment[]> {
    return this.equipmentModel.find({ user: userId as any }).sort({ createdAt: -1 }).exec();
  }

  async createEquipment(data: Partial<Equipment>, userId: any): Promise<Equipment> {
    const item = new this.equipmentModel({ ...data, user: userId });
    return item.save();
  }

  async updateEquipment(id: string, data: Partial<Equipment>, userId: any): Promise<Equipment | null> {
    return this.equipmentModel.findOneAndUpdate({ _id: id, user: userId as any }, data, { returnDocument: 'after' }).exec();
  }

  async deleteEquipment(id: string, userId: any): Promise<Equipment | null> {
    return this.equipmentModel.findOneAndDelete({ _id: id, user: userId as any }).exec();
  }
}
