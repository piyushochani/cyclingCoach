import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BackgroundJob, JobStatusValue } from './job-status.schema';

@Injectable()
export class JobStatusService {
  constructor(
    @InjectModel(BackgroundJob.name) private jobModel: Model<BackgroundJob>,
  ) {}

  async create(params: {
    userId: string;
    bullJobId: string;
    queue: string;
    jobName: string;
  }): Promise<BackgroundJob> {
    return this.jobModel.findOneAndUpdate(
      { bullJobId: params.bullJobId },
      {
        $setOnInsert: {
          userId: params.userId,
          bullJobId: params.bullJobId,
          queue: params.queue,
          jobName: params.jobName,
          status: 'queued' as JobStatusValue,
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).exec() as Promise<BackgroundJob>;
  }

  async updateStatus(
    bullJobId: string,
    status: JobStatusValue,
    extra?: { result?: Record<string, unknown>; error?: string },
  ): Promise<void> {
    await this.jobModel.updateOne(
      { bullJobId },
      {
        $set: {
          status,
          ...(extra?.result !== undefined ? { result: extra.result } : {}),
          ...(extra?.error !== undefined ? { error: extra.error } : {}),
          ...(status === 'completed' || status === 'failed'
            ? { completedAt: new Date() }
            : {}),
        },
      },
    ).exec();
  }

  async getForUser(bullJobId: string, userId: string): Promise<BackgroundJob | null> {
    return this.jobModel.findOne({ bullJobId, userId }).lean().exec() as Promise<BackgroundJob | null>;
  }

  async getActiveForUser(userId: string, queue: string, jobName: string): Promise<BackgroundJob | null> {
    return this.jobModel.findOne({
      userId,
      queue,
      jobName,
      status: { $in: ['queued', 'active'] },
    }).sort({ createdAt: -1 }).lean().exec() as Promise<BackgroundJob | null>;
  }
}
