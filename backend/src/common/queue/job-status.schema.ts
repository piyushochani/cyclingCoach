import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobStatusValue = 'queued' | 'active' | 'completed' | 'failed';

@Schema({ timestamps: true, collection: 'background_jobs' })
export class BackgroundJob extends Document {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, unique: true, index: true })
  bullJobId!: string;

  @Prop({ required: true, index: true })
  queue!: string;

  @Prop({ required: true })
  jobName!: string;

  @Prop({ default: 'queued' })
  status!: JobStatusValue;

  @Prop({ type: Object })
  result?: Record<string, unknown>;

  @Prop()
  error?: string;

  @Prop()
  completedAt?: Date;
}

export const BackgroundJobSchema = SchemaFactory.createForClass(BackgroundJob);
