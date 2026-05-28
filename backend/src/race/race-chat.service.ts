import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RaceChat } from './race-chat.schema';
import { Race } from './race.schema';

@Injectable()
export class RaceChatService {
  constructor(
    @InjectModel(RaceChat.name) private raceChatModel: Model<RaceChat>,
    @InjectModel(Race.name) private raceModel: Model<Race>,
  ) {}

  async findByRace(raceId: string): Promise<any> {
    const chat = await this.raceChatModel.findOne({ race: raceId as any }).exec();
    return chat;
  }

  async findOrCreate(raceId: string, userId: string): Promise<RaceChat> {
    let chat = await this.raceChatModel.findOne({ race: raceId as any }).exec();
    if (!chat) {
      chat = new this.raceChatModel({
        race: raceId as any,
        user: userId as any,
        messages: [],
      });
      chat = await chat.save();

      const race = await this.raceModel.findById(raceId).exec();
      if (race) {
        const chatIds = race.raceChat || [];
        chatIds.push(chat._id as any);
        await this.raceModel.findByIdAndUpdate(raceId, { raceChat: chatIds }).exec();
      }
    }
    return chat;
  }

  async addMessage(raceId: string, userId: string, role: string, content: string): Promise<RaceChat> {
    const chat = await this.findOrCreate(raceId, userId);
    chat.messages.push({ role, content, timestamp: new Date() } as any);
    return chat.save();
  }

  async deleteChat(raceId: string, userId: string): Promise<boolean> {
    const result = await this.raceChatModel.findOneAndDelete({
      race: raceId as any,
      user: userId as any,
    }).exec();
    if (result) {
      await this.raceModel.findByIdAndUpdate(raceId, { raceChat: [] }).exec();
    }
    return !!result;
  }
}
