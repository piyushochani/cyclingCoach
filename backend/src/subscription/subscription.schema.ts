import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: ['free', 'pro'], default: 'free' })
  tier: string;

  @Prop({ default: null })
  startDate: Date;

  @Prop({ default: null })
  endDate: Date;

  @Prop({ default: 'active', enum: ['active', 'canceled', 'expired', 'past_due'] })
  status: string;

  @Prop({ default: null })
  stripeCustomerId: string;

  @Prop({ default: null })
  stripeSubscriptionId: string;

  @Prop({ default: false })
  cancelAtPeriodEnd: boolean;

  @Prop({ default: null })
  trialEndDate: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
