import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class PaymentCard extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  lastFour: string;

  @Prop({ required: true })
  cardHolderName: string;

  @Prop({ required: true })
  expiryMonth: number;

  @Prop({ required: true })
  expiryYear: number;

  @Prop({ required: true })
  brand: string;

  @Prop({ default: false })
  isDefault: boolean;
}

export const PaymentCardSchema = SchemaFactory.createForClass(PaymentCard);
