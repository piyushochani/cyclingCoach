import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserId } from '../common/user-id.decorator';
import { AnalysisService } from './analysis.service';
import { NotificationService } from '../notification/notification.service';
import { TrainingContextService } from '../training-context/training-context.service';
import { Activity } from '../activity/activity.schema';

@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly notificationService: NotificationService,
    private readonly trainingContext: TrainingContextService,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
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

    const generated: number[] = [];

    const recentActivities = await this.activityModel
      .find({
        user: userId as any,
        sport: { $regex: /ride|cycling|bike|bicycle|velomobile|handcycle/i },
      })
      .sort({ date: -1 })
      .limit(20)
      .lean()
      .exec();

    for (const relativeWeek of [0, 1]) {
      const existing = await this.trainingContext.getWeeklyPlan(userId, relativeWeek);
      if (hasUsableWorkouts(existing)) continue;

      try {
        const result = await this.analysisService.generateNextWeekPlan(recentActivities, userId);
        if (result.workouts?.length > 0) {
          await this.trainingContext.upsertWeeklyPlan(userId, relativeWeek, {
            workouts: result.workouts,
            coachNotes: result.coachNotes,
            status: 'generated',
          });
          generated.push(relativeWeek);
        }
      } catch (err) {
        this.logger.error(`Failed to generate plan for week ${relativeWeek}: ${err}`);
      }
    }

    if (generated.length > 0) {
      const weekLabel = generated.map((w) => w === 0 ? 'current' : 'next').join(' and ');
      await this.notificationService.create(userId, 'system', 'Training Plan Ready',
        `Your ${weekLabel} week training plan${generated.length > 1 ? 's have' : ' has'} been generated.`,
        { generated: generated.map((w) => `week-${w}`), link: '/ai-training' },
      ).catch(() => {});
    }

    return { generated: generated.length, message: generated.length > 0 ? `${generated.length} plan(s) generated` : 'All plans already exist' };
  }
}

function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

/** A plan is only usable if it has at least one workout carrying real detail (dayOfWeek + type).
 *  This guards against stale/corrupt plans whose workouts were stored as { _id }-only. */
function hasUsableWorkouts(plan: any): boolean {
  if (!plan || !Array.isArray(plan.workouts)) return false;
  return plan.workouts.some(
    (w: any) => w && w.dayOfWeek != null && w.type != null,
  );
}
