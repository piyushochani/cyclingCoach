import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { BestEffortRecord, Segment, SegmentEffort, BestEffortsSyncStatus } from './best-efforts.schema';
import { NotificationService } from '../notification/notification.service';

const STRAVA_BEST_EFFORT_NAMES = [
  '1,000m', '5,000m', '10,000m', '20,000m', '30,000m', '40,000m', '50,000m',
] as const;

const CYCLING_SPORTS = ['cycling', 'bike', 'ride', 'bicycle'];
const STRAVA_API = 'https://www.strava.com/api/v3';

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
export class BestEffortsService {
  private readonly logger = new Logger(BestEffortsService.name);
  private config: StravaConfig | null = null;

  constructor(
    @InjectModel(BestEffortRecord.name) private bestEffortModel: Model<BestEffortRecord>,
    @InjectModel(Segment.name) private segmentModel: Model<Segment>,
    private readonly notificationService: NotificationService,
    @InjectModel(SegmentEffort.name) private segmentEffortModel: Model<SegmentEffort>,
    @InjectModel(BestEffortsSyncStatus.name) private syncStatusModel: Model<BestEffortsSyncStatus>,
  ) {
    this.loadConfig();
  }

  async getCachedResults(userId: any) {
    return this.getStoredResults(userId);
  }

  async getSyncStatus(userId: any) {
    if (!userId) return { status: 'idle', lastSyncAt: null, hasNewData: false };
    const status = await this.syncStatusModel.findOne({ user: userId as any }).exec();
    if (!status) return { status: 'idle', lastSyncAt: null, hasNewData: false };
    return {
      status: status.status,
      lastSyncAt: status.lastSyncAt || null,
      hasNewData: status.hasNewData || false,
      error: status.error || null,
    };
  }

  async triggerBackgroundSync(userId: any): Promise<{ status: string }> {
    if (!userId) return { status: 'error' };

    const existing = await this.syncStatusModel.findOne({ user: userId as any }).exec();
    if (existing && existing.status === 'syncing') {
      return { status: 'syncing' };
    }

    await this.syncStatusModel.updateOne(
      { user: userId as any },
      { $set: { status: 'syncing', error: null, hasNewData: false, user: userId as any } },
      { upsert: true },
    ).exec();

    this.runBackgroundSync(userId).catch(() => {});

    return { status: 'syncing' };
  }

  private async runBackgroundSync(userId: any) {
    try {
      const before = await this.getStoredResults(userId);
      await this.compute(userId);
      const after = await this.getStoredResults(userId);

      const hasNewData = JSON.stringify(before) !== JSON.stringify(after);

      await this.syncStatusModel.updateOne(
        { user: userId as any },
        { $set: { status: 'idle', lastSyncAt: new Date(), hasNewData } },
      ).exec();
    } catch (err: any) {
      this.logger.error(`Background sync failed: ${err.message}`);
      await this.syncStatusModel.updateOne(
        { user: userId as any },
        { $set: { status: 'idle', error: err.message, lastSyncAt: new Date() } },
      ).exec();
    }
  }

  private loadConfig() {
    // 1. Try environment variables first
    const envClientId = process.env.STRAVA_CLIENT_ID;
    const envClientSecret = process.env.STRAVA_CLIENT_SECRET;
    if (envClientId && envClientSecret) {
      this.config = {
        clientId: envClientId,
        clientSecret: envClientSecret,
        accessToken: process.env.STRAVA_ACCESS_TOKEN || '',
        refreshToken: process.env.STRAVA_REFRESH_TOKEN || '',
        expiresAt: parseInt(process.env.STRAVA_EXPIRES_AT || '0', 10),
      };
      return;
    }

    // 2. Fallback to config.yaml
    const configPaths = [
      join(homedir(), '.cycling-coach', 'config.yaml'),
      join(homedir(), '.config', 'cycling-coach', 'config.yaml'),
      join(homedir(), '.enduragent', 'cycling-coach', 'config.yaml'),
    ];

    for (const filePath of configPaths) {
      if (existsSync(filePath)) {
        try {
          const raw = readFileSync(filePath, 'utf-8');
          const config = parseYaml(raw) as any;
          const s = config?.strava;
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

  private async compute(userId: any) {
    const allActivities: any[] = [];
    for (let page = 1; page <= 4; page++) {
      const batch = await this.stravaFetch(`/athlete/activities?per_page=50&page=${page}`);
      if (!batch || !Array.isArray(batch) || batch.length === 0) break;
      allActivities.push(...batch);
    }

    if (allActivities.length === 0) return;

    const cyclingActivities = allActivities.filter((a) => isCyclingSport(a.type || ''));

    await this.storeLongestRides(cyclingActivities, userId);
    await this.syncSegmentEfforts(cyclingActivities, userId);
  }

  private async storeLongestRides(activities: any[], userId: any) {
    const oldRecords = await this.bestEffortModel.find({ user: userId, category: 'longest' }).exec();
    const oldMap = new Map<number, any>();
    for (const r of oldRecords) {
      oldMap.set(r.rank, r);
    }

    await this.bestEffortModel.deleteMany({ user: userId, category: 'longest' }).exec();

    const sorted = [...activities]
      .filter((a) => (a.distance || 0) > 0)
      .sort((a, b) => (b.distance || 0) - (a.distance || 0))
      .slice(0, 10);

    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      const old = oldMap.get(i + 1);
      const isFresh = old ? (a.distance || 0) > old.distance : false;
      await this.bestEffortModel.create({
        label: `${((a.distance || 0) / 1000).toFixed(1)} km`,
        time: a.moving_time || a.elapsed_time || 0,
        distance: a.distance || 0,
        avgSpeed: (a.distance && (a.moving_time || a.elapsed_time))
          ? (a.distance) / ((a.moving_time || a.elapsed_time))
          : 0,
        date: a.start_date_local || a.start_date || '',
        activityName: a.name || 'Unknown',
        activityId: String(a.id),
        rank: i + 1,
        category: 'longest',
        user: userId,
        previousBest: old ? old.distance : undefined,
        isFresh,
      });

      if (isFresh) {
        this.notificationService.createBestEffortNotification(
          String(userId._id || userId),
          'Longest Ride',
          `${((a.distance || 0) / 1000).toFixed(1)} km`,
          String(a.id),
          a.name || 'Unknown',
        ).catch(() => {});
      }
    }
  }

  private async syncSegmentEfforts(activities: any[], userId: any) {
    for (const act of activities) {
      if (!isCyclingSport(act.type || '')) continue;
      const detail = await this.stravaFetch(`/activities/${act.id}?include_all_efforts=true`);
      if (!detail) continue;

      if (detail.segment_efforts) {
        for (const se of detail.segment_efforts) {
          try {
            const seg = se.segment;
            if (seg) {
              await this.segmentModel.updateOne(
                { stravaId: seg.id, user: userId },
                {
                  $set: {
                    stravaId: seg.id,
                    name: seg.name || 'Unknown',
                    distance: seg.distance || 0,
                    elevationGain: seg.total_elevation_gain || 0,
                    city: seg.city || '',
                    state: seg.state || '',
                    country: seg.country || '',
                    user: userId,
                  },
                },
                { upsert: true },
              ).exec();
            }

            await this.segmentEffortModel.updateOne(
              { stravaId: se.id, user: userId },
              {
                $set: {
                  stravaId: se.id,
                  segmentStravaId: seg?.id || 0,
                  name: se.name || 'Unknown',
                  elapsedTime: se.elapsed_time || 0,
                  movingTime: se.moving_time || 0,
                  startDate: se.start_date || '',
                  distance: se.distance || 0,
                  komRank: se.kom_rank != null ? se.kom_rank : null,
                  prRank: se.pr_rank != null ? se.pr_rank : null,
                  isKom: se.kom_rank === 1,
                  isPr: se.pr_rank === 1,
                  activityId: String(se.activity?.id || ''),
                  activityName: se.activity?.name || '',
                  segmentName: seg?.name || '',
                  user: userId,
                },
              },
              { upsert: true },
            ).exec();
          } catch {}
        }
      }

      if (detail.best_efforts) {
        const existingRecords = await this.bestEffortModel.find({ user: userId, category: 'strava_best' }).exec();
        const existingMap = new Map<string, any>();
        for (const r of existingRecords) {
          const t = r.time || 0;
          const existing = existingMap.get(r.label);
          if (!existing || t < existing.time) {
            existingMap.set(r.label, r);
          }
        }

        for (const be of detail.best_efforts) {
          if (!STRAVA_BEST_EFFORT_NAMES.includes(be.name)) continue;
          const label = be.name;
          const candidateTime = be.elapsed_time || 0;
          const existing = existingMap.get(label);
          if (!existing || candidateTime < existing.time) {
            existingMap.set(label, {
              label,
              time: candidateTime,
              distance: be.distance || 0,
              avgSpeed: be.distance && candidateTime ? be.distance / candidateTime : 0,
              date: be.start_date || '',
              activityName: detail.name || 'Unknown',
              activityId: String(detail.id),
              category: 'strava_best',
              user: userId,
              previousBest: existing?.time || null,
              isFresh: existing ? candidateTime < existing.time : true,
            });
          }
        }

        await this.bestEffortModel.deleteMany({ user: userId, category: 'strava_best' }).exec();

        let rank = 1;
        const sorted = [...existingMap.values()].sort((a, b) => (b.distance || 0) - (a.distance || 0));
        for (const entry of sorted) {
          await this.bestEffortModel.create({ ...entry, rank: rank++ });
          if (entry.isFresh) {
            this.notificationService.createBestEffortNotification(
              String(userId._id || userId),
              `Best Effort: ${entry.label}`,
              `${(entry.time / 60).toFixed(1)} min`,
              entry.activityId,
              entry.activityName,
            ).catch(() => {});
          }
        }
      }
    }
  }

  private async getStoredResults(userId: any) {
    const filter = { user: userId as any };

    let bestEffortRecords = await this.bestEffortModel.find({ ...filter, category: 'strava_best' }).sort({ rank: 1 }).exec();
    if (bestEffortRecords.length === 0) {
      bestEffortRecords = await this.bestEffortModel.find({ ...filter, category: 'fastest' }).sort({ rank: 1 }).exec();
    }
    const bestEfforts = bestEffortRecords.map((r) => ({
      id: r._id.toString(),
      label: r.label,
      name: r.activityName,
      time: r.time,
      date: r.date,
      distance: r.distance,
      avgSpeed: r.avgSpeed,
      rank: r.rank,
      isFresh: r.isFresh || false,
      previousBest: r.previousBest || null,
    }));

    const longestRecords = await this.bestEffortModel.find({ ...filter, category: 'longest' }).sort({ rank: 1 }).exec();
    const longestRides = longestRecords.map((r) => ({
      id: r._id.toString(),
      name: r.activityName,
      time: r.time,
      date: r.date,
      distance: r.distance,
      avgSpeed: r.avgSpeed,
      rank: r.rank,
      label: r.label,
      isFresh: r.isFresh || false,
      previousBest: r.previousBest || null,
    }));

    const allEfforts = await this.segmentEffortModel.find(filter).sort({ komRank: 1, prRank: 1 }).limit(100).exec();
    const mapEffort = (se: any) => ({
      id: se._id.toString(),
      stravaId: se.stravaId,
      name: se.name,
      movingTime: se.movingTime,
      startDate: se.startDate,
      distance: se.distance,
      komRank: se.komRank,
      prRank: se.prRank,
      isKom: se.isKom,
      isPr: se.isPr,
      activityName: se.activityName,
      segmentName: se.segmentName,
    });

    const all = allEfforts.map(mapEffort);
    const koms = allEfforts.filter((e) => e.isKom).map(mapEffort);
    const top10 = allEfforts.filter((e) => e.komRank != null && e.komRank <= 10).map(mapEffort);

    return { bestEfforts, longestRides, segments: { koms, top10, all } };
  }
}
