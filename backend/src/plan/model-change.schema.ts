import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../user/user.schema';

@Schema()
export class ModelChangeRecommendation extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  previousModel: string;

  @Prop({ required: true })
  suggestedModel: string;

  @Prop({ default: '' })
  reason: string;

  @Prop({ default: 'medium' })
  confidenceScore: string;

  @Prop({ default: Date.now })
  triggeredAt: Date;

  @Prop({ default: null })
  userDecision: string;

  @Prop({ default: null })
  appliedAt: Date;

  @Prop({ default: null })
  dismissedAt: Date;

  @Prop({ default: false })
  isAutoApplied: boolean;

  @Prop({ default: 'pending', enum: ['pending', 'accepted', 'declined', 'snoozed', 'auto-applied'] })
  status: string;

  @Prop({ default: null })
  safetyCheckPassed: boolean;

  @Prop({ default: null })
  safetyCheckNotes: string;
}

export const ModelChangeRecommendationSchema = SchemaFactory.createForClass(ModelChangeRecommendation);
