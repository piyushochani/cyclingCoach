import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.schema';
import { ChatQueryController } from './chat-query.controller';
import { ChatQueryService } from './chat-query.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [ChatQueryController],
  providers: [ChatQueryService],
})
export class ChatQueryModule {}
