import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

class NutritionTiming {
  @Prop({ required: true })
  timing: string;

  @Prop({ default: '' })
  what: string;

  @Prop({ default: '' })
  amount: string;

  @Prop({ default: '' })
  notes: string;
}

const NutritionTimingSchema = SchemaFactory.createForClass(NutritionTiming);

@Schema()
export class RaceNutrition extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Race', required: true })
  race: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: [NutritionTimingSchema], default: [] })
  schedule: NutritionTiming[];

  @Prop({ default: '' })
  preRaceMeal: string;

  @Prop({ default: '' })
  duringRace: string;

  @Prop({ default: '' })
  postRace: string;

  @Prop({ default: '' })
  hydrationStrategy: string;

  @Prop({ default: Date.now })
  generatedAt: Date;
}

export const RaceNutritionSchema = SchemaFactory.createForClass(RaceNutrition);
