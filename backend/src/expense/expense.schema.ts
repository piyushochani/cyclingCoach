import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Expense extends Document {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  itemName: string;

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ required: true })
  cost: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
