import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

class WorkoutDay {
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

const WorkoutDaySchema = SchemaFactory.createForClass(WorkoutDay);

@Schema()
export class WeeklyPlan extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ default: 0 })
  year: number;

  @Prop({ default: 0 })
  week: number;

  @Prop({ required: true })
  relativeWeek: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ type: [WorkoutDaySchema], default: [] })
  workouts: WorkoutDay[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  skeleton: Record<string, any>;

  @Prop({ default: '' })
  coachNotes: string;

  @Prop({ default: '' })
  rawText: string;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const WeeklyPlanSchema = SchemaFactory.createForClass(WeeklyPlan);
