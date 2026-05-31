import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class AgentMemory extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Map, of: String, default: {} })
  sections: Map<string, string>;

  @Prop({ type: [{ date: String, notes: [String] }], default: [] })
  dailyNotes: Array<{ date: string; notes: string[] }>;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  currentPlan: Record<string, any> | null;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AgentMemorySchema = SchemaFactory.createForClass(AgentMemory);
