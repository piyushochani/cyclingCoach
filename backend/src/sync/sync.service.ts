import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import polyline from '@mapbox/polyline';
import { Activity } from '../activity/activity.schema';
import { User } from '../user/user.schema';
import { ActivitySyncPipelineService } from '../analysis/activity-sync-pipeline.service';
import { AnalysisService } from '../analysis/analysis.service';
import { NotificationService } from '../notification/notification.service';
import { GearService } from '../gear/gear.service';
import { TrainingContextService } from '../training-context/training-context.service';
import { StravaTokenService } from '../strava-auth/strava-token.service';

function haversineMeters(a: [number, number], b: [number, number]): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aVal = sinDLat * sinDLat + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

function simplifiedLatLng(latlng: [number, number][], minMeters = 30): [number, number][] {
  if (!latlng || latlng.length < 2) return latlng || [];
  const result: [number, number][] = [latlng[0]];
  for (let i = 1; i < latlng.length - 1; i++) {
    if (haversineMeters(result[result.length - 1], latlng[i]) >= minMeters) {
      result.push(latlng[i]);
    }
  }
  result.push(latlng[latlng.length - 1]);
  return result;
}

const CYCLING_SPORTS = ['ride', 'virtualride', 'ebikeride', 'velomobile', 'handcycle', 'cycling', 'bike', 'bicycle'];
const STREAM_KEYS = ['time', 'distance', 'latlng', 'altitude', 'velocity_smooth', 'heartrate', 'cadence', 'watts', 'temp', 'moving', 'grade_smooth'];

function isCyclingSport(sport: string): boolean {
  const s = (sport || '').toLowerCase();
  return CYCLING_SPORTS.some(cycling => s.includes(cycling));
}

const SYNC_MONTHS = parseInt(process.env.STRAVA_SYNC_MONTHS || '6', 10);

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private rateLimitHit = false;

  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly activityPipeline: ActivitySyncPipelineService,
    private readonly analysisService: AnalysisService,
    private readonly notificationService: NotificationService,
    private readonly gearService: GearService,
    private readonly trainingContext: TrainingContextService,
    private readonly stravaTokens: StravaTokenService,
  ) {}

  private async userHasStrava(userId: string): Promise<boolean> {
    const token = await this.stravaTokens.getValidAccessToken(userId);
    return !!token;
  }

  private async stravaFetch(userId: string, path: string): Promise<any> {
    const result = await this.stravaTokens.stravaFetch(userId, path);
    if (result === null && path.includes('/athlete')) {
      this.rateLimitHit = true;
    }
    return result;
  }

  private async fetchDetailedActivity(stravaId: number, userId: string): Promise<any> {
    return this.stravaFetch(userId, `/activities/${stravaId}`);
  }

  private async fetchActivityStreams(stravaId: number, userId: string): Promise<any> {
    const keys = STREAM_KEYS.join(',');
    return this.stravaFetch(userId, `/activities/${stravaId}/streams?keys=${keys}&key_by_type=true`);
  }

  getRateLimitHit(): boolean {
    return this.rateLimitHit;
  }

  resetRateLimitFlag(): void {
    this.rateLimitHit = false;
  }

  private async fetchAllActivities(userId: string): Promise<any[]> {
    const all: any[] = [];
    const perPage = 100;
    const after = Math.floor(new Date(Date.now() - SYNC_MONTHS * 30 * 24 * 3600 * 1000).getTime() / 1000);
    let page = 1;
    while (true) {
      const batch = await this.stravaFetch(userId, `/athlete/activities?per_page=${perPage}&page=${page}&after=${after}`);
      if (!batch || !Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }
    return all;
  }

  private async fetchRecentActivities(userId: string, afterEpoch?: number): Promise<any[]> {
    const perPage = 50;
    let url = `/athlete/activities?per_page=${perPage}`;
    if (afterEpoch) url += `&after=${afterEpoch}`;
    const batch = await this.stravaFetch(userId, url);
    if (!Array.isArray(batch)) return [];
    return batch;
  }

  private async processSingleActivity(
    a: any,
    userId: string,
    userFtp?: number,
    userWeightKg?: number,
  ): Promise<void> {
    const stravaId = a.id;

    if (!isCyclingSport(a.sport_type || a.type)) {
      this.logger.debug(`Activity ${stravaId} is not a ride (${a.sport_type || a.type}), skipping`);
      return;
    }

    const distance = a.distance || 0;
    const movingTime = a.moving_time || a.elapsed_time || 0;
    const elevation = a.total_elevation_gain || 0;
    const calories = a.calories || 0;

    const existing = await this.activityModel.findOne({ stravaId, user: userId as any }).exec();
    if (existing && existing.embeddingStatus === 'done') {
      this.logger.debug(`Activity ${stravaId} already processed, skipping`);
      return;
    }

    let rawActivity: any = null;
    let rawStreams: any = null;
    try {
      rawActivity = await this.fetchDetailedActivity(stravaId, userId);
    } catch {
      this.logger.warn(`Failed to fetch detailed activity ${stravaId}, using list data`);
    }

    try {
      const streamsResult = await this.fetchActivityStreams(stravaId, userId);
      if (streamsResult && Array.isArray(streamsResult)) {
        rawStreams = {};
        for (const entry of streamsResult) {
          rawStreams[entry.type] = entry.data;
        }
      }
    } catch {
      this.logger.warn(`Failed to fetch streams for activity ${stravaId}, continuing without streams`);
    }

    const simplified = rawStreams?.latlng ? simplifiedLatLng(rawStreams.latlng as [number, number][]) : null;
    const encodedPolyline = simplified ? polyline.encode(simplified) : null;

    if (rawStreams) {
      const compact: Record<string, any> = { sampleRate: 1 };
      if (rawStreams.watts) compact.power = rawStreams.watts;
      if (rawStreams.heartrate) compact.heartRate = rawStreams.heartrate;
      if (rawStreams.altitude) compact.elevation = rawStreams.altitude;
      if (rawStreams.distance && rawStreams.time) {
        const speed: number[] = [];
        for (let i = 0; i < rawStreams.distance.length; i++) {
          if (i === 0) { speed.push(0); continue; }
          const dt = (rawStreams.time[i] - rawStreams.time[i - 1]) / 3600;
          const dd = (rawStreams.distance[i] - rawStreams.distance[i - 1]) / 1000;
          speed.push(dt > 0 ? parseFloat((dd / dt).toFixed(1)) : 0);
        }
        compact.speed = speed;
      }
      rawStreams = compact;
    }

    const activityPayload: any = {
      name: (rawActivity?.name || a.name || 'Unknown'),
      sport: (rawActivity?.sport_type || rawActivity?.type || a.type || 'Ride'),
      distance: rawActivity?.distance ?? distance,
      durationSeconds: rawActivity?.moving_time ?? movingTime,
      elevationGain: rawActivity?.total_elevation_gain ?? elevation,
      calories: rawActivity?.calories ?? calories,
      averageWatts: rawActivity?.average_watts ?? a.average_watts ?? null,
      maxWatts: rawActivity?.max_watts ?? a.max_watts ?? null,
      weightedAverageWatts: rawActivity?.weighted_average_watts ?? a.weighted_average_watts ?? null,
      kilojoules: rawActivity?.kilojoules ?? a.kilojoules ?? null,
      averageHeartrate: rawActivity?.average_heartrate ?? a.average_heartrate ?? null,
      maxHeartrate: rawActivity?.max_heartrate ?? a.max_heartrate ?? null,
      trainer: rawActivity?.trainer ?? a.trainer ?? false,
      date: new Date(rawActivity?.start_date_local || a.start_date_local || a.start_date || Date.now()),
      tracked: false,
      user: userId as any,
    };

    activityPayload.userFtp = userFtp;
    activityPayload.userMaxHr = rawActivity?.max_heartrate || a.max_heartrate || null;

    if (existing) {
      await this.activityModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...activityPayload,
            rawActivity: rawActivity ?? null,
            rawStreams: rawStreams ?? null,
            polyline: encodedPolyline,
            embeddingStatus: 'pending',
            updatedAt: new Date(),
          },
        },
      ).exec();
      this.logger.debug(`Updated existing activity ${stravaId} with raw data`);
    } else {
      await this.activityModel.create({
        ...activityPayload,
        rawActivity: rawActivity ?? null,
        rawStreams: rawStreams ?? null,
        polyline: encodedPolyline,
        embeddingStatus: 'pending',
        syncedAt: new Date(),
        updatedAt: new Date(),
      });
      this.logger.debug(`Created new activity ${stravaId} with raw data`);
      this.notificationService.createActivitySynced(userId, activityPayload.name || 'Ride', String(stravaId)).catch(() => {});
    }

    const gearId = rawActivity?.gear?.id || rawActivity?.gear_id || null;
    if (gearId && distance > 0) {
      try {
        const existing = await this.gearService.findBikeByStravaId(gearId, userId);
        if (existing) {
          await this.gearService.addDistanceToStravaBike(gearId, distance, userId);
        } else {
          await this.gearService.upsertBikeByStravaId(gearId, { name: rawActivity?.gear?.name || 'Strava Bike', distance }, userId);
        }
      } catch (e) {
        this.logger.warn(`Failed to update gear distance for activity ${stravaId}: ${(e as Error).message}`);
      }
    }

    await this.activityPipeline.processActivity(
      { ...activityPayload, id: stravaId },
      userId,
      rawActivity,
      rawStreams,
    );

    try {
      const savedActivity = await this.activityModel.findOne({ stravaId, user: userId as any }).sort({ _id: -1 }).exec();
      if (savedActivity) {
        await this.analysisService.queueActivityAnalysis(String(savedActivity._id), userId);

        const activityDate = savedActivity.date || new Date(rawActivity?.start_date_local || Date.now());
        const result = await this.trainingContext.markWorkoutCompletedByDate(userId, activityDate);
        if (result.matched) {
          this.logger.debug(`Auto-marked ${result.workoutType} workout as completed for ${stravaId}`);
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to queue activity analysis for ${stravaId}: ${(e as Error).message}`);
    }
  }

  async incrementalSync(userId: any): Promise<{ newActivities: number }> {
    if (!userId) return { newActivities: 0 };
    const user = await this.userModel.findById(userId as any).exec();
    if (!user) return { newActivities: 0 };
    if (!(await this.userHasStrava(String(userId)))) {
      this.logger.warn(`User ${userId} has no Strava connection — skipping sync`);
      return { newActivities: 0 };
    }

    const afterEpoch = user.lastSyncAt ? Math.floor(user.lastSyncAt.getTime() / 1000) - 3600 : undefined;
    const activities = await this.fetchRecentActivities(String(userId), afterEpoch);
    if (activities.length === 0) {
      const now = new Date();
      user.lastSyncAt = now;
      user.stravaUpdatedAt = now;
      user.isStravaUpToDate = true;
      await user.save();
      return { newActivities: 0 };
    }

    const ftp = user.ftp || undefined;
    const weightKg = user.weightKg || undefined;
    let newCount = 0;
    let addDistance = 0;
    let addMovingTime = 0;
    let addElevation = 0;
    let addCalories = 0;

    for (const a of activities) {
      if (!isCyclingSport(a.sport_type || a.type)) continue;
      const exists = await this.activityModel.findOne({ stravaId: a.id, user: userId as any }).exec();
      if (exists && exists.embeddingStatus === 'done') continue;

      if (!exists) {
        addDistance += a.distance || 0;
        addMovingTime += a.moving_time || a.elapsed_time || 0;
        addElevation += a.total_elevation_gain || 0;
        addCalories += a.calories || 0;
      }

      await this.processSingleActivity(a, String(user._id), ftp, weightKg);
      newCount++;
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

    const now = new Date();
    user.lastSyncAt = now;
    user.stravaUpdatedAt = now;
    user.isStravaUpToDate = true;
    await user.save();

    if (newCount > 0) {
      await this.notificationService.createSyncCompleteNotification(String(user._id), newCount).catch(() => {});
    }

    this.syncAthleteGear(user._id).catch(() => {});

    return { newActivities: newCount };
  }

  async fullSync(userId: any, includeBestEfforts = false): Promise<{ newActivities: number }> {
    if (!userId) return { newActivities: 0 };
    const user = await this.userModel.findById(userId as any).exec();
    if (!user) return { newActivities: 0 };
    if (!(await this.userHasStrava(String(userId)))) {
      this.logger.warn(`User ${userId} has no Strava connection — skipping sync`);
      return { newActivities: 0 };
    }

    const existingCount = await this.activityModel.countDocuments({ user: userId as any }).exec();
    const allActivities = existingCount > 0
      ? await this.fetchRecentActivities(String(userId))
      : await this.fetchAllActivities(String(userId));

    if (allActivities.length === 0) {
      const now = new Date();
      user.lastSyncAt = now;
      user.stravaUpdatedAt = now;
      user.isStravaUpToDate = true;
      await user.save();
      return { newActivities: 0 };
    }

    const ftp = user.ftp || undefined;
    const weightKg = user.weightKg || undefined;
    let newCount = 0;
    let addDistance = 0;
    let addMovingTime = 0;
    let addElevation = 0;
    let addCalories = 0;

    for (const a of allActivities) {
      if (!isCyclingSport(a.sport_type || a.type)) continue;
      const exists = await this.activityModel.findOne({ stravaId: a.id, user: userId as any }).exec();
      if (exists && exists.embeddingStatus === 'done') continue;

      if (!exists) {
        addDistance += a.distance || 0;
        addMovingTime += a.moving_time || a.elapsed_time || 0;
        addElevation += a.total_elevation_gain || 0;
        addCalories += a.calories || 0;
      }

      await this.processSingleActivity(a, String(user._id), ftp, weightKg);
      newCount++;
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

    const now = new Date();
    user.lastSyncAt = now;
    user.stravaUpdatedAt = now;
    user.isStravaUpToDate = true;
    await user.save();

    this.syncAthleteGear(user._id).catch(() => {});

    return { newActivities: newCount };
  }

  async syncLatestActivity(userId: any): Promise<any> {
    if (!userId) return null;
    const user = await this.userModel.findById(userId as any).exec();
    if (!user) return null;
    if (!(await this.userHasStrava(String(userId)))) return null;

    const batch = await this.stravaFetch(String(userId), '/athlete/activities?per_page=1');
    if (!Array.isArray(batch) || batch.length === 0) return null;
    const a = batch[0];
    if (!isCyclingSport(a.sport_type || a.type)) return null;

    const existing = await this.activityModel.findOne({ stravaId: a.id, user: userId as any }).exec();
    if (existing && existing.embeddingStatus === 'done') {
      return existing.toObject();
    }

    const ftp = user.ftp || undefined;
    const weightKg = user.weightKg || undefined;
    await this.processSingleActivity(a, String(user._id), ftp, weightKg);

    return this.activityModel.findOne({ stravaId: a.id, user: userId as any }).lean().exec();
  }

  async analyzeLatestActivity(userId: any): Promise<{ analysis: string }> {
    if (!userId) return { analysis: '' };

    const latest = await this.activityModel.findOne({ user: userId as any }).sort({ date: -1 }).lean().exec();
    if (!latest) return { analysis: '' };

    const latestId = latest._id;
    const result = await this.analysisService.analyze(
      { type: 'daily', activities: [latest as any] },
      userId,
    );

    await this.activityModel.updateOne(
      { _id: latestId },
      { $set: { llmAnalysis: result.analysis } },
    ).exec();

    const preview = result.analysis.slice(0, 200);
    this.notificationService.createRideAnalysis(
      String(userId),
      String(latest.stravaId),
      latest.name || 'Ride',
      preview,
    ).catch(() => {});

    return result;
  }

  async getLatestActivityDate(userId: any): Promise<Date | null> {
    const latest = await this.activityModel.findOne({ user: userId as any }).sort({ date: -1 }).exec();
    return latest?.date || null;
  }

  async syncAthleteGear(userId: any): Promise<number> {
    const athlete = await this.stravaFetch(String(userId), '/athlete');
    if (!athlete || !Array.isArray(athlete.bikes)) return 0;
    return this.gearService.syncBikesFromStrava(
      athlete.bikes.map((b: any) => ({
        id: b.id,
        name: b.name,
        distance: b.distance || 0,
        primary: b.primary || false,
      })),
      userId,
    );
  }

  async getSyncStatus(userId: any): Promise<{ updatedAt: Date | null; isUpToDate: boolean; syncWindowMonths: number; rateLimitExhausted: boolean }> {
    const user = await this.userModel.findById(userId as any).exec();
    if (!user) return { updatedAt: null, isUpToDate: false, syncWindowMonths: SYNC_MONTHS, rateLimitExhausted: this.rateLimitHit };

    return {
      updatedAt: user.stravaUpdatedAt || null,
      isUpToDate: user.isStravaUpToDate ?? false,
      syncWindowMonths: SYNC_MONTHS,
      rateLimitExhausted: this.rateLimitHit,
    };
  }
}
