import { Controller, Get, NotFoundException, Param, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../user-id.decorator';
import { JobStatusService } from './job-status.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobStatusService: JobStatusService) {}

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');

    const job = await this.jobStatusService.getForUser(jobId, userId);
    if (!job) throw new NotFoundException('Job not found');

    return {
      jobId: job.bullJobId,
      queue: job.queue,
      jobName: job.jobName,
      status: job.status,
      result: job.result ?? null,
      error: job.error ?? null,
      completedAt: job.completedAt ?? null,
    };
  }
}
