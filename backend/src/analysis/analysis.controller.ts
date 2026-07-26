import { Controller, Post, Body, Logger } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { AnalysisService } from './analysis.service';
import { NotificationService } from '../notification/notification.service';
import { TrainingContextService } from '../training-context/training-context.service';
import { PlanQueueService } from '../plan/plan-queue.service';

@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly notificationService: NotificationService,
    private readonly trainingContext: TrainingContextService,
    private readonly planQueueService: PlanQueueService,
  ) {}

  @Post()
  async analyze(
    @Body() body: {
      type: 'daily' | 'weekly' | 'monthly' | 'chat';
      activities: any[];
      message?: string;
      previousActivities?: any[];
    },
    @UserId() userId: string,
  ) {
    return this.analysisService.analyze(body, userId);
  }

  @Post('generate-plan')
  async generatePlan(
    @Body() body: { activities: any[]; weekNumber?: number; relativeWeek?: number; save?: boolean },
    @UserId() userId: string,
  ) {
    const result = await this.analysisService.generateNextWeekPlan(body.activities || [], userId);

    if (result.workouts?.length > 0) {
      const weekNum = body.weekNumber || getCurrentWeekNumber();
      this.notificationService.createWeeklyPlanReady(userId, weekNum).catch(() => {});

      if (body.save !== false && body.relativeWeek != null) {
        try {
          await this.trainingContext.upsertWeeklyPlan(userId, body.relativeWeek, {
            workouts: result.workouts,
            coachNotes: result.coachNotes,
            status: 'generated',
          });
        } catch (err) {
          this.logger.error(`Failed to save generated plan: ${err}`);
        }
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDay = tomorrow.getDay();
      const dayMap = [6, 0, 1, 2, 3, 4, 5];
      const tmw = dayMap[tomorrowDay];

      const tomorrowWorkout = result.workouts.find((w: any) => w.dayOfWeek === tmw);
      if (tomorrowWorkout) {
        const dateStr = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        this.notificationService.createUpcomingActivityAlert(userId, tomorrowWorkout.type || 'Workout', dateStr).catch(() => {});
      }
    }

    return result;
  }

  @Post('ensure-plans')
  async ensurePlans(@UserId() userId: string) {
    if (!userId) return { generated: 0, message: 'User ID required' };

    const enqueued = await this.planQueueService.enqueueEnsurePlans(userId);
    if (enqueued.async) {
      return { jobId: enqueued.jobId, status: enqueued.status };
    }

    const result = await this.analysisService.ensurePlans(userId);
    if (result.generated > 0) {
      await this.notificationService.create(userId, 'system', 'Training Plan Ready',
        `${result.generated} training plan(s) generated.`,
        { link: '/ai-training' },
      ).catch(() => {});
    }
    return result;
  }
}

function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}
