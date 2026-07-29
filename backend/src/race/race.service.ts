import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Race } from './race.schema';

@Injectable()
export class RaceService {
  constructor(
    @InjectModel(Race.name) private raceModel: Model<Race>,
  ) {}

  findAll(): Promise<any[]> {
    return this.raceModel.find().lean().exec();
  }

  findAllByUserId(userId: any): Promise<any[]> {
    return this.raceModel.find({ user: userId as any }).lean().exec();
  }

  findById(id: string, userId: string): Promise<Race | null> {
    return this.raceModel
      .findOne({ _id: id, user: userId as any })
      .populate('racePlan dietPlan raceNutrition aiSuggestions raceChat')
      .exec();
  }

  create(race: Partial<Race>): Promise<Race> {
    const newRace = new this.raceModel(race);
    return newRace.save();
  }

  update(id: string, race: Partial<Race>, userId?: any): Promise<Race | null> {
    const filter: any = { _id: id };
    if (userId) filter.user = userId as any;
    return this.raceModel.findOneAndUpdate(filter, race, { returnDocument: 'after' }).exec();
  }

  delete(id: string, userId?: any): Promise<Race | null> {
    const filter: any = { _id: id };
    if (userId) filter.user = userId as any;
    return this.raceModel.findOneAndDelete(filter).exec();
  }
}
