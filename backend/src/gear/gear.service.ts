import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bike, Equipment } from './gear.schema';

@Injectable()
export class GearService {
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
