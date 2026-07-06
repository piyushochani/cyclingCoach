import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ collection: 'best_efforts', timestamps: true })
export class BestEffortRecord extends Document {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  time: number;

  @Prop({ required: true })
  distance: number;

  @Prop({ required: true })
  avgSpeed: number;

  @Prop({ required: true })
  date: string;

  @Prop()
  activityName: string;

  @Prop()
  activityId: string;

  @Prop({ required: true })
  rank: number;

  @Prop({ default: 'fastest' })
  category: string;

  @Prop()
  previousBest: number;

  @Prop({ default: false })
  isFresh: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;
}

export const BestEffortRecordSchema = SchemaFactory.createForClass(BestEffortRecord);

@Schema({ collection: 'segments', timestamps: true })
export class Segment extends Document {
  @Prop({ required: true, unique: true })
  stravaId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  distance: number;

  @Prop({ default: 0 })
  elevationGain: number;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  state: string;

  @Prop({ default: '' })
  country: string;

  @Prop({ default: false })
  hazardous: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;
}

export const SegmentSchema = SchemaFactory.createForClass(Segment);

@Schema({ collection: 'segment_efforts', timestamps: true })
export class SegmentEffort extends Document {
  @Prop({ required: true, unique: true })
  stravaId: number;

  @Prop({ required: true })
  segmentStravaId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  elapsedTime: number;

  @Prop({ required: true })
  movingTime: number;

  @Prop()
  startDate: string;

  @Prop()
  distance: number;

  @Prop()
  komRank: number;

  @Prop()
  prRank: number;

  @Prop({ default: false })
  isKom: boolean;

  @Prop({ default: false })
  isPr: boolean;

  @Prop()
  activityId: string;

  @Prop()
  activityName: string;

  @Prop()
  segmentName: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;
}

export const SegmentEffortSchema = SchemaFactory.createForClass(SegmentEffort);

@Schema({ collection: 'best_efforts_sync_status', timestamps: true })
export class BestEffortsSyncStatus extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ default: 'idle' })
  status: string;

  @Prop()
  lastSyncAt: Date;

  @Prop()
  error: string;

  @Prop({ default: false })
  hasNewData: boolean;
}

export const BestEffortsSyncStatusSchema = SchemaFactory.createForClass(BestEffortsSyncStatus);
