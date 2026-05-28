import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

class MealEntry {
  @Prop({ required: true })
  day: number;

  @Prop({ required: true })
  meal: string;

  @Prop({ required: true })
  time: string;

  @Prop({ default: '' })
  foods: string;

  @Prop({ default: '' })
  notes: string;
}

const MealEntrySchema = SchemaFactory.createForClass(MealEntry);

@Schema()
export class DietPlan extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Race', required: true })
  race: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: [MealEntrySchema], default: [] })
  meals: MealEntry[];

  @Prop({ default: '' })
  generalGuidelines: string;

  @Prop({ default: Date.now })
  generatedAt: Date;
}

export const DietPlanSchema = SchemaFactory.createForClass(DietPlan);
