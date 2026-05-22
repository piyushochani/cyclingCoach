import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  findOne(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(user: Partial<User>): Promise<User> {
    if (user.passwordHash) {
      user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
    }
    const newUser = new this.userModel(user);
    return newUser.save();
  }
}
