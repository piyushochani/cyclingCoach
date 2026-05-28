import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Race extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  distance: number;

  @Prop({ required: true })
  elevationGain: number;

  @Prop({ required: true })
  priority: string;

  @Prop({ default: '' })
  time: string;

  @Prop({ default: null })
  position: number;

  @Prop({ default: null })
  number: number;

  @Prop({ default: null })
  totalRiders: number;

  @Prop({ default: '' })
  story: string;

  @Prop({ default: '' })
  terrain: string;

  @Prop({ default: '' })
  weather: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: null })
  completed: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RacePlan', default: null })
  racePlan: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'DietPlan', default: null })
  dietPlan: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RaceNutrition', default: null })
  raceNutrition: MongooseSchema.Types.ObjectId;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'AISuggestion' }])
  aiSuggestions: MongooseSchema.Types.ObjectId[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'RaceChat' }])
  raceChat: MongooseSchema.Types.ObjectId[];
}

export const RaceSchema = SchemaFactory.createForClass(Race);
