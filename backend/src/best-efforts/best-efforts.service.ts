import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { BestEffortRecord, Segment, SegmentEffort } from './best-efforts.schema';

const DISTANCE_BUCKETS = [
  { label: '5 km', minKm: 0, maxKm: 7.5 },
  { label: '10 km', minKm: 7.5, maxKm: 15 },
  { label: '20 km', minKm: 15, maxKm: 30 },
  { label: '50 km', minKm: 30, maxKm: 75 },
  { label: '100 km', minKm: 75, maxKm: 150 },
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
    @InjectModel(SegmentEffort.name) private segmentEffortModel: Model<SegmentEffort>,
  ) {
    this.loadConfig();
  }

  private loadConfig() {
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

  async compute(userId?: any): Promise<{
    fastest: Record<string, any[]>;
    longestRides: any[];
    segments: { koms: any[]; top10: any[]; all: any[] };
  }> {
    const userIdObj = userId as any;
    const empty = { fastest: {}, longestRides: [], segments: { koms: [], top10: [], all: [] } };

    if (!userId) return empty;

    const activities: any[] = await this.stravaFetch('/athlete/activities?per_page=50');
    if (!activities || !Array.isArray(activities)) {
      return this.getStoredResults(userIdObj);
    }

    const cyclingActivities = activities.filter((a) => isCyclingSport(a.type || ''));

    await this.storeFastestEfforts(cyclingActivities, userIdObj);
    await this.storeLongestRides(cyclingActivities, userIdObj);
    await this.syncSegmentEfforts(cyclingActivities, userIdObj);

    return this.getStoredResults(userIdObj);
  }

  private async storeFastestEfforts(activities: any[], userId: any) {
    await this.bestEffortModel.deleteMany({ user: userId, category: 'fastest' }).exec();

    for (const bucket of DISTANCE_BUCKETS) {
      const distanceMeters = bucket.minKm * 1000;
      const matches = activities
        .filter((a) => {
          const d = (a.distance || 0);
          return d >= bucket.minKm * 1000 && d < bucket.maxKm * 1000;
        })
        .map((a) => ({
          time: a.moving_time || a.elapsed_time || 0,
          distance: a.distance || 0,
          avgSpeed: (a.distance && (a.moving_time || a.elapsed_time))
            ? (a.distance) / ((a.moving_time || a.elapsed_time))
            : 0,
          date: a.start_date_local || a.start_date || '',
          activityName: a.name || 'Unknown',
          activityId: String(a.id),
        }))
        .sort((a, b) => b.avgSpeed - a.avgSpeed)
        .slice(0, 5);

      for (let i = 0; i < matches.length; i++) {
        await this.bestEffortModel.create({
          ...matches[i],
          label: bucket.label,
          rank: i + 1,
          category: 'fastest',
          user: userId,
        });
      }
    }
  }

  private async storeLongestRides(activities: any[], userId: any) {
    await this.bestEffortModel.deleteMany({ user: userId, category: 'longest' }).exec();

    const sorted = [...activities]
      .filter((a) => (a.distance || 0) > 0)
      .sort((a, b) => (b.distance || 0) - (a.distance || 0))
      .slice(0, 10);

    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
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
      });
    }
  }

  private async syncSegmentEfforts(activities: any[], userId: any) {
    for (const act of activities) {
      if (!isCyclingSport(act.type || '')) continue;
      const detail = await this.stravaFetch(`/activities/${act.id}?include_all_efforts=true`);
      if (!detail?.segment_efforts) continue;

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
  }

  private async getStoredResults(userId: any) {
    const filter = { user: userId as any };

    const fastestRecords = await this.bestEffortModel.find({ ...filter, category: 'fastest' }).sort({ rank: 1 }).exec();
    const fastest: Record<string, any[]> = {};
    for (const bucket of DISTANCE_BUCKETS) {
      fastest[bucket.label] = fastestRecords
        .filter((r) => r.label === bucket.label)
        .map((r) => ({
          id: r._id.toString(),
          name: r.activityName,
          time: r.time,
          date: r.date,
          distance: r.distance,
          avgSpeed: r.avgSpeed,
          rank: r.rank,
        }));
    }

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

    return { fastest, longestRides, segments: { koms, top10, all } };
  }
}
