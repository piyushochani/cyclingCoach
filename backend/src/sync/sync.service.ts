import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { Activity } from '../activity/activity.schema';
import { User } from '../user/user.schema';

const STRAVA_API = 'https://www.strava.com/api/v3';
const CYCLING_SPORTS = ['cycling', 'bike', 'ride', 'bicycle'];

function isCyclingSport(sport: string): boolean {
  return CYCLING_SPORTS.includes((sport || '').toLowerCase());
}

interface StravaConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private config: StravaConfig | null = null;

  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.loadConfig();
  }

  private loadConfig() {
    const configPaths = [
      join(homedir(), '.cycling-coach', 'config.yaml'),
      join(homedir(), '.config', 'cycling-coach', 'config.yaml'),
      join(homedir(), '.enduragent', 'cycling-coach', 'config.yaml'),
    ];
    for (const p of configPaths) {
      if (existsSync(p)) {
        try {
          const raw = readFileSync(p, 'utf-8');
          const c = parseYaml(raw) as any;
          const s = c?.strava;
          if (s?.client_id && s?.client_secret) {
            this.config = {
              clientId: String(s.client_id),
              clientSecret: String(s.client_secret),
              accessToken: process.env.STRAVA_ACCESS_TOKEN || s.access_token || '',
              refreshToken: process.env.STRAVA_REFRESH_TOKEN || s.refresh_token || '',
              expiresAt: parseInt(process.env.STRAVA_EXPIRES_AT || s.expires_at || '0', 10),
            };
            return;
          }
        } catch {}
      }
    }
  }

  private async ensureValidToken(): Promise<string | null> {
    if (!this.config?.accessToken) return null;
    const now = Math.floor(Date.now() / 1000);
    if (this.config.expiresAt > now + 60) return this.config.accessToken;
    try {
      const res = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      this.config.accessToken = data.access_token;
      this.config.refreshToken = data.refresh_token;
      this.config.expiresAt = data.expires_at;
      return data.access_token;
    } catch {
      return null;
    }
  }

  private async stravaFetch(path: string): Promise<any> {
    const token = await this.ensureValidToken();
    if (!token) return null;
    try {
      const res = await fetch(`${STRAVA_API}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  private async fetchAllActivities(userId: any): Promise<any[]> {
    const all: any[] = [];
    const perPage = 100;
    const after = Math.floor(new Date('2026-01-01').getTime() / 1000);
    let page = 1;
    while (true) {
      const batch = await this.stravaFetch(`/athlete/activities?per_page=${perPage}&page=${page}&after=${after}`);
      if (!batch || !Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }
    return all;
  }

  private async fetchRecentActivities(userId: any, afterEpoch?: number): Promise<any[]> {
    const perPage = 50;
    let url = `/athlete/activities?per_page=${perPage}`;
    if (afterEpoch) url += `&after=${afterEpoch}`;
    const batch = await this.stravaFetch(url);
    if (!Array.isArray(batch)) return [];
    return batch;
  }

  async incrementalSync(userId: any): Promise<{ newActivities: number }> {
    if (!userId) return { newActivities: 0 };
    const user = await this.userModel.findById(userId as any).exec();
    if (!user) return { newActivities: 0 };

    const afterEpoch = user.lastSyncAt ? Math.floor(user.lastSyncAt.getTime() / 1000) - 3600 : undefined;
    const activities = await this.fetchRecentActivities(userId, afterEpoch);
    if (activities.length === 0) {
      user.lastSyncAt = new Date();
      await user.save();
      return { newActivities: 0 };
    }

    let newCount = 0;
    let addDistance = 0;
    let addMovingTime = 0;
    let addElevation = 0;
    let addCalories = 0;

    for (const a of activities) {
      const exists = await this.activityModel.findOne({ stravaId: a.id, user: userId as any }).exec();
      if (exists) continue;

      const distance = a.distance || 0;
      const movingTime = a.moving_time || a.elapsed_time || 0;
      const elevation = a.total_elevation_gain || 0;
      const calories = a.calories || 0;

      await this.activityModel.create({
        stravaId: a.id,
        name: a.name || 'Unknown',
        sport: a.type || 'Ride',
        distance,
        durationSeconds: movingTime,
        elevationGain: elevation,
        calories,
        date: new Date(a.start_date_local || a.start_date || Date.now()),
        tracked: false,
        user: userId as any,
      });

      newCount++;
      addDistance += distance;
      addMovingTime += movingTime;
      addElevation += elevation;
      addCalories += calories;
    }

    if (newCount > 0) {
      await this.userModel.findByIdAndUpdate(userId as any, {
        $inc: {
          totalDistance: addDistance,
          totalMovingTime: addMovingTime,
          totalElevation: addElevation,
          totalCalories: addCalories,
        },
      }).exec();
    }

    user.lastSyncAt = new Date();
    await user.save();

    return { newActivities: newCount };
  }

  async fullSync(userId: any, includeBestEfforts = false): Promise<{ newActivities: number }> {
    if (!userId) return { newActivities: 0 };
    const user = await this.userModel.findById(userId as any).exec();
    if (!user) return { newActivities: 0 };

    const existingCount = await this.activityModel.countDocuments({ user: userId as any }).exec();
    const allActivities = existingCount > 0
      ? await this.fetchRecentActivities(userId)
      : await this.fetchAllActivities(userId);

    if (allActivities.length === 0) {
      user.lastSyncAt = new Date();
      await user.save();
      return { newActivities: 0 };
    }

    let newCount = 0;
    let addDistance = 0;
    let addMovingTime = 0;
    let addElevation = 0;
    let addCalories = 0;

    for (const a of allActivities) {
      const exists = await this.activityModel.findOne({ stravaId: a.id, user: userId as any }).exec();
      if (exists) continue;

      const distance = a.distance || 0;
      const movingTime = a.moving_time || a.elapsed_time || 0;
      const elevation = a.total_elevation_gain || 0;
      const calories = a.calories || 0;

      await this.activityModel.create({
        stravaId: a.id,
        name: a.name || 'Unknown',
        sport: a.type || 'Ride',
        distance,
        durationSeconds: movingTime,
        elevationGain: elevation,
        calories,
        date: new Date(a.start_date_local || a.start_date || Date.now()),
        tracked: false,
        user: userId as any,
      });

      newCount++;
      addDistance += distance;
      addMovingTime += movingTime;
      addElevation += elevation;
      addCalories += calories;
    }

    if (newCount > 0) {
      await this.userModel.findByIdAndUpdate(userId as any, {
        $inc: {
          totalDistance: addDistance,
          totalMovingTime: addMovingTime,
          totalElevation: addElevation,
          totalCalories: addCalories,
        },
      }).exec();
    }

    user.lastSyncAt = new Date();
    await user.save();

    return { newActivities: newCount };
  }
}
