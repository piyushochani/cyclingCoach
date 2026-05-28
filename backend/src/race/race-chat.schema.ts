import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

class ChatMessage {
  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema()
export class RaceChat extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Race', required: true })
  race: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages: ChatMessage[];
}

export const RaceChatSchema = SchemaFactory.createForClass(RaceChat);
