import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AdminAuditLog extends Document {
  @Prop({ required: true })
  action: string;

  @Prop({ default: null })
  targetType: string;

  @Prop({ default: null })
  targetId: string;

  @Prop({ required: true })
  adminUsername: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AdminAuditLogSchema = SchemaFactory.createForClass(AdminAuditLog);

AdminAuditLogSchema.index({ createdAt: -1 });
