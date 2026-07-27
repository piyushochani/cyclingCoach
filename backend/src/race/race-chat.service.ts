import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findByRace(raceId: string, userId: string): Promise<any> {
    return this.raceChatModel.findOne({ race: raceId as any, user: userId as any }).exec();
  }

  private async assertRaceOwnership(raceId: string, userId: string): Promise<void> {
    const race = await this.raceModel.findOne({ _id: raceId, user: userId as any }).exec();
    if (!race) throw new NotFoundException('Race not found');
  }

  async findOrCreate(raceId: string, userId: string): Promise<RaceChat> {
    await this.assertRaceOwnership(raceId, userId);

    let chat = await this.raceChatModel.findOne({ race: raceId as any, user: userId as any }).exec();
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
