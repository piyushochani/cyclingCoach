import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Activity extends Document {
  @Prop({ default: 0 })
  stravaId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  sport: string;

  @Prop({ required: true })
  distance: number;

  @Prop({ required: true })
  durationSeconds: number;

  @Prop({ required: true })
  elevationGain: number;

  @Prop({ default: 0 })
  calories: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: false })
  tracked: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  gear: Record<string, any>;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
