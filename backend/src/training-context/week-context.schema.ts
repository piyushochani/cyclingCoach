import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class WeekContext extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  week: number;

  @Prop({ type: Object, default: {} })
  summary: Record<string, any>;

  @Prop({ default: '' })
  rawText: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const WeekContextSchema = SchemaFactory.createForClass(WeekContext);
