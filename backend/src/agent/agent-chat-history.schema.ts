import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class AgentChatHistory extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ default: '' })
  chatId: string;

  @Prop({ type: [{ role: String, content: String, timestamp: { type: Date, default: Date.now } }], default: [] })
  messages: Array<{ role: string; content: string; timestamp: Date }>;

  @Prop({ default: null })
  lastMessageTime: Date;

  @Prop({ default: false })
  archived: boolean;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AgentChatHistorySchema = SchemaFactory.createForClass(AgentChatHistory);
AgentChatHistorySchema.index({ userId: 1, chatId: 1 }, { unique: true });
