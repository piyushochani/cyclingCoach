import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../user/user.schema';

@Schema()
export class Activity extends Document {
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

  @Prop({ required: true })
  date: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
