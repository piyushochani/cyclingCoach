import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type EmbeddingStatus = 'pending' | 'done' | 'failed';

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

  @Prop({ default: null })
  averageWatts: number;

  @Prop({ default: null })
  maxWatts: number;

  @Prop({ default: null })
  weightedAverageWatts: number;

  @Prop({ default: null })
  kilojoules: number;

  @Prop({ default: null })
  averageHeartrate: number;

  @Prop({ default: null })
  maxHeartrate: number;

  @Prop({ default: false })
  trainer: boolean;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: false })
  tracked: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  gear: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  rawActivity: Record<string, any> | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  rawStreams: Record<string, any> | null;

  @Prop({ type: String, default: null })
  polyline: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  processed: Record<string, any> | null;

  @Prop({ default: null })
  summaryText: string;

  @Prop({ default: null })
  vectorId: string;

  @Prop({ default: 'pending', enum: ['pending', 'done', 'failed'] })
  embeddingStatus: EmbeddingStatus;

  @Prop({ default: null })
  syncedAt: Date;

  @Prop({ default: null })
  updatedAt: Date;

  @Prop({ type: String, default: null })
  llmAnalysis: string | null;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

ActivitySchema.index({ user: 1, date: -1 });
ActivitySchema.index({ user: 1, stravaId: 1 });
