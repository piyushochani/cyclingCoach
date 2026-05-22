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

  create(race: Partial<Race>): Promise<Race> {
    const newRace = new this.raceModel(race);
    return newRace.save();
  }
}
