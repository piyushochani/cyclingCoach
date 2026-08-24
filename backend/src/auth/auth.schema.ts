import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Otp extends Document {
  @Prop({ required: true })
  email: string;

  @Prop()
  code: string;

  @Prop()
  provider?: string;

  @Prop()
  providerRef?: string;

  @Prop({ required: true })
  type: string;

  @Prop({ default: false })
  used: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
