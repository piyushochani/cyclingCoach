import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import { Activity } from '../activity/activity.schema';

const CYCLING_FILTER = { sport: { $regex: /ride|cycling|bike|bicycle|velomobile|handcycle/i } };

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getAllStats() {
    const activities = await this.activityModel.find(CYCLING_FILTER).exec();
    const totalDistance = activities.reduce((sum, act) => sum + act.distance, 0);
    const totalDuration = activities.reduce((sum, act) => sum + act.durationSeconds, 0);
    const totalElevation = activities.reduce((sum, act) => sum + act.elevationGain, 0);
    return { totalDistance, totalDuration, totalElevation, activityCount: activities.length };
  }

  async getUserStats(userId: any) {
    const user = await this.userModel.findById(userId as any).exec();
    const activities = await this.activityModel.find({ ...CYCLING_FILTER, user: userId as any }).sort({ date: -1 }).exec();
    const activityCount = activities.length;

    const totalDistance = activities.reduce((s, a) => s + (a.distance || 0), 0);
    const totalDuration = activities.reduce((s, a) => s + (a.durationSeconds || 0), 0);
    const totalElevation = activities.reduce((s, a) => s + (a.elevationGain || 0), 0);
    const totalCalories = activities.reduce((s, a) => s + (a.calories || 0), 0);

    const avgDistance = activityCount > 0 ? totalDistance / activityCount : 0;
    const avgDuration = activityCount > 0 ? totalDuration / activityCount : 0;
    const longestRide = activities.length > 0 ? Math.max(...activities.map((a) => a.distance || 0)) : 0;
    const biggestElevationDay = activities.length > 0 ? Math.max(...activities.map((a) => a.elevationGain || 0)) : 0;

    const sportDist: Record<string, number> = {};
    for (const a of activities) {
      const s = (a.sport || 'other').toLowerCase();
      sportDist[s] = (sportDist[s] || 0) + (a.distance || 0);
    }

    const days: Record<string, number> = {};
    for (const a of activities) {
      if (a.date) {
        const d = new Date(a.date).toISOString().slice(0, 10);
        days[d] = (days[d] || 0) + 1;
      }
    }

    const activeDays = Object.keys(days).length;
    const dates = Object.keys(days).sort();
    let currentStreak = 0;
    let bestStreak = 0;
    let streakCount = 0;
    const today = new Date();
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = new Date(dates[i]);
      const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
      if (diff === currentStreak) {
        streakCount++;
        currentStreak++;
      } else if (diff > currentStreak) {
        break;
      }
    }
    currentStreak = streakCount;
    let tempStreak = 0;
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    const weeks: Record<string, number> = {};
    for (const a of activities) {
      if (a.date) {
        const d = new Date(a.date);
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        weeks[key] = (weeks[key] || 0) + 1;
      }
    }
    const totalWeeks = Object.keys(weeks).length;
    const activeWeeks = Object.values(weeks).filter((c) => c >= 3).length;
    const consistencyScore = totalWeeks > 0 ? Math.round((activeWeeks / totalWeeks) * 100) : 0;

    const gears: Record<string, number> = {};
    for (const a of activities) {
      if (a.gear) {
        const g = typeof a.gear === 'object' ? JSON.stringify(a.gear) : String(a.gear);
        gears[g] = (gears[g] || 0) + (a.distance || 0);
      }
    }

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration,
      totalElevation: Math.round(totalElevation * 100) / 100,
      totalCalories: Math.round(totalCalories),
      activityCount,
      avgDistance: Math.round(avgDistance * 100) / 100,
      avgDuration: Math.round(avgDuration),
      longestRide: Math.round(longestRide * 100) / 100,
      biggestElevationDay: Math.round(biggestElevationDay * 100) / 100,
      currentStreak,
      bestStreak,
      consistencyScore,
      activeDays,
      sportDist,
      gears,
      weeklyActivityCount: weeks,
    };
  }
}
