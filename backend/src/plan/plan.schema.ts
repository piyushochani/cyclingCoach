import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../user/user.schema';

@Schema()
export class TrainingPlan extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  content: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ default: null })
  selectedPeriodisationModel: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  feasibilityResult: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  planSkeleton: Record<string, any>;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  renderedWeeklyPlans: Record<string, any>[];

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  modelChangeHistory: Record<string, any>[];

  @Prop({ default: 'draft' })
  status: string;

  @Prop({ default: Date.now })
  generatedAt: Date;

  @Prop({ default: Date.now })
  lastUpdatedAt: Date;

  @Prop({ default: null })
  completedAt: Date;
}

export const TrainingPlanSchema = SchemaFactory.createForClass(TrainingPlan);
