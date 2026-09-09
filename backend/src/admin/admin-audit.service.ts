import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminAuditLog } from './admin-audit.schema';

@Injectable()
export class AdminAuditService {
  constructor(
    @InjectModel(AdminAuditLog.name) private auditModel: Model<AdminAuditLog>,
  ) {}

  async log(
    adminUsername: string,
    action: string,
    targetType?: string,
    targetId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.auditModel.create({
      adminUsername,
      action,
      targetType: targetType ?? undefined,
      targetId: targetId ?? undefined,
      metadata: metadata || {},
    });
  }

  async findRecent(limit = 50, skip = 0): Promise<AdminAuditLog[]> {
    return this.auditModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }
}
