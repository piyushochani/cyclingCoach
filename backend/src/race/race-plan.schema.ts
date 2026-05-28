import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

class RacePlanDay {
  @Prop({ required: true })
  day: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  type: string;

  @Prop({ default: '' })
  instructions: string;
}

const RacePlanDaySchema = SchemaFactory.createForClass(RacePlanDay);

@Schema()
export class RacePlan extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Race', required: true })
  race: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: [RacePlanDaySchema], default: [] })
  days: RacePlanDay[];

  @Prop({ default: Date.now })
  generatedAt: Date;

  @Prop({ default: null })
  expiresAt: Date;
}

export const RacePlanSchema = SchemaFactory.createForClass(RacePlan);
