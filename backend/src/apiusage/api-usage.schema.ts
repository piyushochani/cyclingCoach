import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiUsageStatus = 'healthy' | 'exhausted' | 'invalid' | 'unknown';

@Schema({ timestamps: true })
export class ApiUsage extends Document {
  @Prop({ required: true })
  provider: string;

  @Prop({ required: true, default: '' })
  pool: string;

  @Prop({ required: true })
  index: number;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  keyMasked: string;

  @Prop({ required: true, default: '' })
  keyHash: string;

  @Prop({ default: '' })
  apiModel: string;

  @Prop({ required: true, default: 'unknown' })
  status: ApiUsageStatus;

  @Prop({ required: true, default: false })
  valid: boolean;

  @Prop({ required: true, default: false })
  modelAccessible: boolean;

  @Prop({ type: String, default: null })
  resetsAt: string | null;

  @Prop({ default: '' })
  error: string;

  @Prop({ required: true, default: Date.now })
  lastChecked: Date;
}

export const ApiUsageSchema = SchemaFactory.createForClass(ApiUsage);
ApiUsageSchema.index({ provider: 1, pool: 1, index: 1 }, { unique: true });