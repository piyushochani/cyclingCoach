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
}

export const UserSchema = SchemaFactory.createForClass(User);
