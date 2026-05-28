import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class AISuggestion extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Race', required: true })
  race: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AISuggestionSchema = SchemaFactory.createForClass(AISuggestion);
