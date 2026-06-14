import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ default: '' })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'cycling' })
  mainSport: string;

  @Prop({ default: 'beginner' })
  experienceLevel: string;

  @Prop({ default: null })
  heightCm: number;

  @Prop({ default: null })
  weightKg: number;

  @Prop({ default: '' })
  goal: string;

  @Prop({ default: 0 })
  cyclingYears: number;

  @Prop({ default: null })
  ftp: number;

  @Prop({ default: null })
  maxHeartrate: number;

  @Prop({ default: null })
  age: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: null })
  profileImage: string;

  @Prop({ default: [] })
  coaches: any[];

  @Prop({ default: 0 })
  totalDistance: number;

  @Prop({ default: 0 })
  totalMovingTime: number;

  @Prop({ default: 0 })
  totalElevation: number;

  @Prop({ default: 0 })
  totalCalories: number;

  @Prop({ default: null })
  lastSyncAt: Date;

  @Prop({ default: 'free', enum: ['free', 'pro'] })
  subscriptionTier: string;

  @Prop({ default: null })
  subscriptionStartDate: Date;

  @Prop({ default: null })
  subscriptionEndDate: Date;

  @Prop({ default: null })
  stripeCustomerId: string;

  @Prop({ default: null })
  stripeSubscriptionId: string;

  @Prop({ default: null })
  stravaUpdatedAt: Date;

  @Prop({ default: false })
  isStravaUpToDate: boolean;

  @Prop({ default: null })
  trainingStart: Date;

  @Prop({ default: '' })
  onboardingSummary: string;

  @Prop({ default: null })
  telegramChatId: string;

  @Prop({ default: 100 })
  weeklyGoalKm: number;

  @Prop({ type: Object, default: null })
  selectedCoach: Record<string, any>;

  @Prop({ type: [Object], default: [] })
  customCoaches: Record<string, any>[];

  @Prop({ default: true })
  autoSyncEnabled: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
