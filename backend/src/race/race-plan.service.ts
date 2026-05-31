import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RacePlan } from './race-plan.schema';
import { Race } from './race.schema';

@Injectable()
export class RacePlanService {
  constructor(
    @InjectModel(RacePlan.name) private racePlanModel: Model<RacePlan>,
    @InjectModel(Race.name) private raceModel: Model<Race>,
  ) {}

  async findByRace(raceId: string): Promise<any> {
    return this.racePlanModel.findOne({ race: raceId as any }).lean().exec();
  }

  async create(raceId: string, userId: string, days: any[]): Promise<RacePlan> {
    const plan = new this.racePlanModel({
      race: raceId as any,
      user: userId as any,
      days,
    });
    const saved = await plan.save();

    await this.raceModel.findByIdAndUpdate(raceId, { racePlan: saved._id }).exec();
    return saved;
  }

  async update(raceId: string, userId: string, days: any[]): Promise<any> {
    return this.racePlanModel.findOneAndUpdate(
      { race: raceId as any, user: userId as any },
      { days },
      { returnDocument: 'after' },
    ).exec();
  }

  async delete(raceId: string, userId: string): Promise<boolean> {
    const result = await this.racePlanModel.findOneAndDelete({
      race: raceId as any,
      user: userId as any,
    }).exec();
    if (result) {
      await this.raceModel.findByIdAndUpdate(raceId, { racePlan: null }).exec();
    }
    return !!result;
  }
}
