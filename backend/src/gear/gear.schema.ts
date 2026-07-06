import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Bike extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  stravaId: string | null;

  @Prop({ required: true, default: Date.now })
  dateAdded: Date;

  @Prop({ required: true, default: 0 })
  distanceUsed: number;

  @Prop({ required: true, default: false })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;
}

export const BikeSchema = SchemaFactory.createForClass(Bike);

@Schema({ timestamps: true })
export class Equipment extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 'other' })
  type: string;

  @Prop({ required: true, default: Date.now })
  dateAdded: Date;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: '' })
  brand: string;

  @Prop({ default: '' })
  equipmentModel: string;

  @Prop({ type: Number, default: null })
  weightG: number | null;

  @Prop({ type: Date, default: null })
  purchaseDate: Date | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;
}

export const EquipmentSchema = SchemaFactory.createForClass(Equipment);
