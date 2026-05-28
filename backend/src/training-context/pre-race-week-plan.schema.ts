import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

class PreRaceWorkout {
  @Prop({ required: true })
  dayOfWeek: number;

  @Prop({ required: true })
  type: string;

  @Prop({ default: 0 })
  distance: number;

  @Prop({ default: '' })
  zoneBreakdown: string;

  @Prop({ default: '' })
  terrain: string;

  @Prop({ default: '' })
  weather: string;

  @Prop({ default: '' })
  notes: string;
}

const PreRaceWorkoutSchema = SchemaFactory.createForClass(PreRaceWorkout);

@Schema()
export class PreRaceWeekPlan extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Race', required: true })
  race: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  weekOffset: number;

  @Prop({ default: '' })
  label: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ type: [PreRaceWorkoutSchema], default: [] })
  workouts: PreRaceWorkout[];

  @Prop({ default: '' })
  coachNotes: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PreRaceWeekPlanSchema = SchemaFactory.createForClass(PreRaceWeekPlan);
