import { Injectable } from '@nestjs/common';

export interface PowerZoneSeconds {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
  z6: number;
  z7: number;
}

export interface HRZoneSeconds {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

export interface HRZoneBoundary {
  zone: string;
  label: string;
  minPercent: number;
  maxPercent: number;
  minBpm: number;
  maxBpm: number;
}

export function computeHRZoneBoundaries(maxHr: number): HRZoneBoundary[] {
  return [
    { zone: 'Z1', label: 'Recovery', minPercent: 50, maxPercent: 60, minBpm: Math.round(maxHr * 0.50), maxBpm: Math.round(maxHr * 0.60) },
    { zone: 'Z2', label: 'Endurance', minPercent: 60, maxPercent: 70, minBpm: Math.round(maxHr * 0.60), maxBpm: Math.round(maxHr * 0.70) },
    { zone: 'Z3', label: 'Tempo', minPercent: 70, maxPercent: 80, minBpm: Math.round(maxHr * 0.70), maxBpm: Math.round(maxHr * 0.80) },
    { zone: 'Z4', label: 'Threshold', minPercent: 80, maxPercent: 90, minBpm: Math.round(maxHr * 0.80), maxBpm: Math.round(maxHr * 0.90) },
    { zone: 'Z5', label: 'VO2 Max', minPercent: 90, maxPercent: 100, minBpm: Math.round(maxHr * 0.90), maxBpm: maxHr },
  ];
}

export interface CadenceFeatures {
  avgCadence: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  lowCadenceClimbingSeconds: number;
  erraticCadence: boolean;
}

export interface PacingFeatures {
  firstThirdAvgWatts: number | null;
  middleThirdAvgWatts: number | null;
  finalThirdAvgWatts: number | null;
  fadePercent: number | null;
  negativeSplit: boolean;
  strongFinish: boolean;
}

export interface ClimbInfo {
  count: number;
  totalGain: number;
  avgGrade: number;
}

export interface ProcessedActivity {
  stravaId: number;
  name: string;
  date: string;
  sport: string;
  distanceKm: number;
  movingTimeMin: number;
  elapsedTimeMin: number;
  elevationGain: number;
  avgSpeedKph: number;
  maxSpeedKph: number | null;
  avgWatts: number | null;
  maxWatts: number | null;
  normalizedPower: number | null;
  intensityFactor: number | null;
  tss: number | null;
  variabilityIndex: number | null;
  kilojoules: number | null;
  avgHeartrate: number | null;
  maxHeartrate: number | null;
  avgCadence: number | null;
  trainer: boolean;
  hasPowerData: boolean;
  hasHrData: boolean;
  hasCadenceData: boolean;
  powerZoneSeconds: PowerZoneSeconds | null;
  hrZoneSeconds: HRZoneSeconds | null;
  cadenceFeatures: CadenceFeatures | null;
  pacingFeatures: PacingFeatures | null;
  terrainClass: 'flat' | 'rolling' | 'hilly' | 'mountainous';
  terrainGradeDistribution: Record<string, number> | null;
  climbs: ClimbInfo;
  sessionType: 'recovery' | 'endurance' | 'tempo' | 'threshold' | 'VO2max' | 'race-like' | 'mixed-terrain-endurance' | 'climbing-session' | 'unknown';
  intensityDescription: string;
  pacingDescription: string;
  cadenceDescription: string;
  rideOutcomeDescription: string;
  coachingSummary: string;
}

@Injectable()
export class DataProcessorService {
  process(
    activity: any,
    streams?: Record<string, number[]>,
    ftp?: number,
    maxHr?: number,
  ): ProcessedActivity {
    const distanceKm = (activity.distance || 0) / 1000;
    const movingTimeSec = activity.durationSeconds || activity.moving_time || 0;
    const movingTimeMin = movingTimeSec / 60;
    const elapsedTimeMin = (activity.elapsed_time || movingTimeSec) / 60;
    const elevationGain = activity.elevationGain || activity.total_elevation_gain || 0;
    const avgSpeedKph = movingTimeSec > 0 ? (distanceKm / movingTimeSec) * 3600 : 0;
    const maxSpeedKph = activity.maxSpeedKph ?? (activity.max_speed ? activity.max_speed * 3.6 : null);

    const powerStream = streams?.watts;
    const hrStream = streams?.heartrate;
    const cadenceStream = streams?.cadence;
    const altitudeStream = streams?.altitude;
    const gradeStream = streams?.grade_smooth;
    const speedStream = streams?.velocity_smooth;
    const timeStream = streams?.time;

    const hasPowerData = !!(powerStream && powerStream.length > 0 && activity.average_watts);
    const hasHrData = !!(hrStream && hrStream.length > 0);
    const hasCadenceData = !!(cadenceStream && cadenceStream.length > 0);

    const effectiveFtp = ftp || 250;
    const effectiveMaxHr = maxHr || activity.maxHeartrate || activity.max_heartrate || 180;

    const powerZones = hasPowerData && powerStream
      ? this.computePowerZones(powerStream, effectiveFtp)
      : null;

    const hrZones = hasHrData && hrStream
      ? this.computeHRZones(hrStream, effectiveMaxHr)
      : null;

    const cadenceFeatures = hasCadenceData && cadenceStream
      ? this.computeCadenceFeatures(cadenceStream, altitudeStream, gradeStream, elevationGain)
      : null;

    const pacingFeatures = hasPowerData && powerStream
      ? this.computePacing(powerStream)
      : null;

    const terrain = this.classifyTerrainAdvanced(elevationGain, distanceKm, gradeStream);

    const climbs = this.detectClimbs(altitudeStream, distanceKm, elevationGain);

    const np: number | null = hasPowerData && powerStream
      ? (this.computeNormalizedPower(powerStream) ?? null)
      : null;
    const if_ = np && effectiveFtp ? Math.round((np / effectiveFtp) * 100) / 100 : null;
    const tss = np && if_ && movingTimeSec > 0 && effectiveFtp
      ? Math.round((movingTimeSec * np * if_) / (effectiveFtp * 3600) * 100)
      : null;
    const vi = np && activity.average_watts && activity.average_watts > 0
      ? Math.round((np / activity.average_watts) * 100) / 100
      : null;

    const sessionType = this.classifySessionType(
      powerZones, np, effectiveFtp, distanceKm, elevationGain, terrain,
    );
    const intensityDescription = this.describeIntensity(powerZones, np, effectiveFtp, hrZones);
    const pacingDescription = this.describePacing(pacingFeatures, vi);
    const cadenceDescription = this.describeCadence(cadenceFeatures);
    const rideOutcomeDescription = this.describeRideOutcome(sessionType, terrain, distanceKm, elevationGain, pacingFeatures);
    const coachingSummary = this.generateCoachingSummary(
      sessionType, intensityDescription, pacingDescription, powerZones, hrZones, cadenceFeatures,
    );

    return {
      stravaId: activity.stravaId || activity.id,
      name: activity.name || 'Unknown',
      date: activity.date || activity.start_date_local || '',
      sport: activity.sport || activity.type || 'Ride',
      distanceKm: Math.round(distanceKm * 100) / 100,
      movingTimeMin: Math.round(movingTimeMin * 10) / 10,
      elapsedTimeMin: Math.round(elapsedTimeMin * 10) / 10,
      elevationGain: Math.round(elevationGain),
      avgSpeedKph: Math.round(avgSpeedKph * 10) / 10,
      maxSpeedKph: maxSpeedKph != null ? Math.round(maxSpeedKph * 10) / 10 : null,
      avgWatts: activity.average_watts ?? activity.averageWatts ?? null,
      maxWatts: activity.max_watts ?? activity.maxWatts ?? null,
      normalizedPower: np != null ? Math.round(np) : null,
      intensityFactor: if_ != null ? Math.round(if_ * 100) / 100 : null,
      tss,
      variabilityIndex: vi,
      kilojoules: activity.kilojoules ?? activity.kilojoules ?? null,
      avgHeartrate: activity.average_heartrate ?? activity.averageHeartrate ?? null,
      maxHeartrate: activity.max_heartrate ?? activity.maxHeartrate ?? null,
      avgCadence: cadenceFeatures?.avgCadence ?? null,
      trainer: activity.trainer ?? false,
      hasPowerData,
      hasHrData,
      hasCadenceData,
      powerZoneSeconds: powerZones,
      hrZoneSeconds: hrZones,
      cadenceFeatures,
      pacingFeatures,
      terrainClass: terrain.terrainClass,
      terrainGradeDistribution: terrain.gradeDistribution,
      climbs,
      sessionType,
      intensityDescription,
      pacingDescription,
      cadenceDescription,
      rideOutcomeDescription,
      coachingSummary,
    };
  }

  private computePowerZones(powerStream: number[], ftp: number): PowerZoneSeconds {
    const zones: PowerZoneSeconds = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, z6: 0, z7: 0 };
    for (const w of powerStream) {
      if (w <= 0) continue;
      const ratio = w / ftp;
      if (ratio <= 0.55) zones.z1++;
      else if (ratio <= 0.75) zones.z2++;
      else if (ratio <= 0.87) zones.z3++;
      else if (ratio <= 0.94) zones.z4++;
      else if (ratio <= 1.05) zones.z5++;
      else if (ratio <= 1.20) zones.z6++;
      else zones.z7++;
    }
    return zones;
  }

  private computeHRZones(hrStream: number[], maxHr: number): HRZoneSeconds {
    const zones: HRZoneSeconds = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
    for (const h of hrStream) {
      if (h <= 0) continue;
      const pct = h / maxHr;
      if (pct < 0.60) zones.z1++;
      else if (pct < 0.70) zones.z2++;
      else if (pct < 0.80) zones.z3++;
      else if (pct < 0.90) zones.z4++;
      else zones.z5++;
    }
    return zones;
  }

  private computeNormalizedPower(powerStream: number[]): number | undefined {
    if (powerStream.length < 30) return undefined;
    const smoothed: number[] = [];
    for (let i = 0; i <= powerStream.length - 30; i++) {
      let sum = 0;
      for (let j = 0; j < 30; j++) sum += powerStream[i + j];
      smoothed.push(sum / 30);
    }
    if (smoothed.length === 0) return undefined;
    let sum4 = 0;
    for (const v of smoothed) sum4 += v ** 4;
    return Math.pow(sum4 / smoothed.length, 0.25);
  }

  private computeCadenceFeatures(
    cadenceStream: number[],
    altitudeStream?: number[],
    gradeStream?: number[],
    totalElevationGain?: number,
  ): CadenceFeatures {
    const valid = cadenceStream.filter(c => c > 0);
    if (valid.length === 0) {
      return { avgCadence: null, p25: null, p50: null, p75: null, lowCadenceClimbingSeconds: 0, erraticCadence: false };
    }
    const sorted = [...valid].sort((a, b) => a - b);
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p50 = sorted[Math.floor(sorted.length * 0.50)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];

    let lowCadenceClimbingSeconds = 0;
    if (altitudeStream || gradeStream) {
      const len = Math.min(cadenceStream.length, gradeStream?.length ?? altitudeStream?.length ?? cadenceStream.length);
      for (let i = 0; i < len; i++) {
        const grade = gradeStream?.[i] ?? 0;
        const altDelta = i > 0 ? (altitudeStream?.[i] ?? 0) - (altitudeStream?.[i - 1] ?? 0) : 0;
        const isClimbing = grade > 3 || altDelta > 1;
        if (isClimbing && cadenceStream[i] > 0 && cadenceStream[i] < 60) {
          lowCadenceClimbingSeconds++;
        }
      }
    }

    const stddev = Math.sqrt(valid.reduce((sum, c) => sum + (c - avg) ** 2, 0) / valid.length);
    const erraticCadence = stddev > 15;

    return { avgCadence: Math.round(avg), p25: Math.round(p25), p50: Math.round(p50), p75: Math.round(p75), lowCadenceClimbingSeconds, erraticCadence };
  }

  private computePacing(powerStream: number[]): PacingFeatures {
    if (powerStream.length < 60) {
      return { firstThirdAvgWatts: null, middleThirdAvgWatts: null, finalThirdAvgWatts: null, fadePercent: null, negativeSplit: false, strongFinish: false };
    }
    const third = Math.floor(powerStream.length / 3);
    const first = powerStream.slice(0, third);
    const middle = powerStream.slice(third, 2 * third);
    const last = powerStream.slice(2 * third, powerStream.length);

    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgMiddle = middle.reduce((a, b) => a + b, 0) / middle.length;
    const avgLast = last.reduce((a, b) => a + b, 0) / last.length;

    const fadePct = avgFirst > 0 ? Math.round(((avgFirst - avgLast) / avgFirst) * 100) : 0;
    const negativeSplit = avgLast > avgFirst + 5;
    const strongFinish = avgLast > avgMiddle + 10;

    return {
      firstThirdAvgWatts: Math.round(avgFirst),
      middleThirdAvgWatts: Math.round(avgMiddle),
      finalThirdAvgWatts: Math.round(avgLast),
      fadePercent: fadePct,
      negativeSplit,
      strongFinish,
    };
  }

  private detectClimbs(
    altitudeStream: number[] | undefined,
    distanceKm: number,
    totalElevationGain: number,
  ): ClimbInfo {
    if (!altitudeStream || altitudeStream.length < 10) {
      const totalGainM = Math.round(totalElevationGain || 0);
      const avgGrade = distanceKm > 0 ? Math.round((totalGainM / (distanceKm * 1000)) * 100) : 0;
      return { count: totalGainM > 200 ? 1 : 0, totalGain: totalGainM, avgGrade };
    }

    let climbs = 0;
    let totalGain = 0;
    let currentGain = 0;
    let inClimb = false;
    let minAlt = altitudeStream[0];

    for (let i = 1; i < altitudeStream.length; i++) {
      const delta = altitudeStream[i] - altitudeStream[i - 1];
      if (delta > 3) {
        if (!inClimb) {
          inClimb = true;
          currentGain = 0;
          minAlt = altitudeStream[i - 1];
        }
        currentGain += delta;
      } else if (delta < -3 && inClimb) {
        if (currentGain > 15) {
          climbs++;
          totalGain += currentGain;
        }
        inClimb = false;
        currentGain = 0;
      }
    }
    if (inClimb && currentGain > 15) {
      climbs++;
      totalGain += currentGain;
    }

    const avgGrade = distanceKm > 0
      ? Math.round((totalElevationGain / (distanceKm * 1000)) * 100)
      : 0;
    return { count: climbs, totalGain: Math.round(totalGain), avgGrade };
  }

  private classifyTerrainAdvanced(
    elevationGain: number,
    distanceKm: number,
    gradeStream?: number[],
  ): { terrainClass: 'flat' | 'rolling' | 'hilly' | 'mountainous'; gradeDistribution: Record<string, number> | null } {
    const gainPerKm = distanceKm > 0 ? elevationGain / distanceKm : 0;

    if (gradeStream && gradeStream.length > 0) {
      let flat = 0, rolling = 0, hilly = 0, steep = 0;
      for (const g of gradeStream) {
        const grade = Math.abs(g);
        if (grade < 2) flat++;
        else if (grade < 5) rolling++;
        else if (grade < 8) hilly++;
        else steep++;
      }
      const total = flat + rolling + hilly + steep;
      const pct = (v: number) => Math.round((v / total) * 100);
      const distribution = { flat: pct(flat), rolling: pct(rolling), hilly: pct(hilly), steep: pct(steep) };

      if (distribution.steep > 15) return { terrainClass: 'mountainous', gradeDistribution: distribution };
      if (distribution.hilly + distribution.steep > 30) return { terrainClass: 'hilly', gradeDistribution: distribution };
      if (distribution.rolling > 40) return { terrainClass: 'rolling', gradeDistribution: distribution };
      return { terrainClass: 'flat', gradeDistribution: distribution };
    }

    if (gainPerKm > 40) return { terrainClass: 'mountainous', gradeDistribution: null };
    if (gainPerKm > 20) return { terrainClass: 'hilly', gradeDistribution: null };
    if (gainPerKm > 8) return { terrainClass: 'rolling', gradeDistribution: null };
    return { terrainClass: 'flat', gradeDistribution: null };
  }

  private classifySessionType(
    powerZones: PowerZoneSeconds | null,
    np: number | null,
    ftp: number,
    distanceKm: number,
    elevationGain: number,
    terrain: { terrainClass: string; gradeDistribution: Record<string, number> | null },
  ): 'recovery' | 'endurance' | 'tempo' | 'threshold' | 'VO2max' | 'race-like' | 'mixed-terrain-endurance' | 'climbing-session' | 'unknown' {
    if (!powerZones || !np) {
      if (elevationGain > distanceKm * 30) return 'climbing-session';
      if (terrain.terrainClass === 'rolling' || terrain.terrainClass === 'hilly') return 'mixed-terrain-endurance';
      if (distanceKm < 20) return 'recovery';
      if (distanceKm < 60) return 'endurance';
      return 'endurance';
    }

    const total = Object.values(powerZones).reduce((a, b) => a + b, 0);
    if (total === 0) return 'unknown';

    const z4plus = powerZones.z4 + powerZones.z5 + powerZones.z6 + powerZones.z7;
    const z5plus = powerZones.z5 + powerZones.z6 + powerZones.z7;
    const z6plus = powerZones.z6 + powerZones.z7;
    const pctHard = (z4plus / total) * 100;
    const pctZ5plus = (z5plus / total) * 100;
    const pctZ6plus = (z6plus / total) * 100;

    if (pctZ6plus > 5 || powerZones.z7 > 60) return 'VO2max';
    if (pctZ5plus > 15) return 'threshold';
    if (pctHard > 50) return 'tempo';
    if (pctHard > 25) return 'endurance';
    if (np / ftp > 1.05) return 'race-like';
    if (elevationGain > distanceKm * 30) return 'climbing-session';
    if (terrain.terrainClass !== 'flat') return 'mixed-terrain-endurance';
    if (total > 0 && z4plus === 0 && powerZones.z1 + powerZones.z2 > 0.8 * total) return 'recovery';
    return 'endurance';
  }

  private describeIntensity(
    powerZones: PowerZoneSeconds | null,
    np: number | null,
    ftp: number,
    hrZones: HRZoneSeconds | null,
  ): string {
    if (powerZones && np) {
      const total = Object.values(powerZones).reduce((a, b) => a + b, 0);
      if (total === 0) return 'unknown';
      const hardPct = Math.round(((powerZones.z4 + powerZones.z5 + powerZones.z6 + powerZones.z7) / total) * 100);
      if (np / ftp > 0.85) return `high intensity (IF ${Math.round((np / ftp) * 100)}%, ${hardPct}% hard)`;
      if (np / ftp > 0.75) return `moderate-high intensity (IF ${Math.round((np / ftp) * 100)}%, ${hardPct}% hard)`;
      if (np / ftp > 0.65) return `moderate intensity (IF ${Math.round((np / ftp) * 100)}%)`;
      return `low intensity (IF ${Math.round((np / ftp) * 100)}%)`;
    }
    if (hrZones) {
      const total = Object.values(hrZones).reduce((a, b) => a + b, 0);
      if (total === 0) return 'unknown';
      const z3plus = Math.round(((hrZones.z3 + hrZones.z4 + hrZones.z5) / total) * 100);
      if (z3plus > 60) return `moderate-high effort (${z3plus}% in Z3+)`;
      if (z3plus > 30) return `moderate effort (${z3plus}% in Z3+)`;
      return `low effort (${z3plus}% in Z3+)`;
    }
    return 'unknown';
  }

  private describePacing(
    pacing: PacingFeatures | null,
    vi: number | null,
  ): string {
    if (!pacing || pacing.fadePercent == null) return 'unknown';

    if (pacing.negativeSplit) return 'negative split (progressive effort)';
    if (pacing.strongFinish) return 'strong finish';
    if (pacing.fadePercent > 20) return `significant fade (${pacing.fadePercent}% drop in late power)`;
    if (pacing.fadePercent > 10) return `moderate fade (${pacing.fadePercent}% drop)`;
    if (vi != null && vi > 1.15) return 'variable pacing with surges';
    if (vi != null && vi < 1.05) return 'steady, consistent pacing';
    return 'even pacing';
  }

  private describeCadence(cadence: CadenceFeatures | null): string {
    if (!cadence || cadence.avgCadence == null) return 'not available';

    const parts: string[] = [];
    if (cadence.avgCadence > 90) parts.push('high (spinning)');
    else if (cadence.avgCadence > 75) parts.push('moderate');
    else parts.push('low (grinding)');

    if (cadence.erraticCadence) parts.push('erratic');
    if (cadence.lowCadenceClimbingSeconds > 120) parts.push(`with ${Math.round(cadence.lowCadenceClimbingSeconds / 60)}min low-cadence climbing`);
    return parts.join(', ');
  }

  private describeRideOutcome(
    sessionType: string,
    terrain: { terrainClass: string; gradeDistribution: Record<string, number> | null },
    distanceKm: number,
    elevationGain: number,
    pacing: PacingFeatures | null,
  ): string {
    const parts: string[] = [];

    if (sessionType === 'recovery') parts.push('easy recovery effort');
    else if (sessionType === 'endurance') parts.push('controlled endurance ride');
    else if (sessionType === 'tempo') parts.push('sustained tempo effort');
    else if (sessionType === 'threshold') parts.push('threshold-focused session');
    else if (sessionType === 'VO2max') parts.push('high-intensity VO2 work');
    else if (sessionType === 'race-like') parts.push('race simulation');
    else if (sessionType === 'climbing-session') parts.push('climbing-focused ride');
    else if (sessionType === 'mixed-terrain-endurance') parts.push('mixed terrain endurance');
    else parts.push('general training ride');

    if (pacing) {
      if (pacing.fadePercent != null && pacing.fadePercent > 20) parts.push('with late-ride fatigue');
      else if (pacing.negativeSplit) parts.push('with building intensity');
      else if (pacing.strongFinish) parts.push('with a strong finish');
    }

    return parts.join(', ');
  }

  private generateCoachingSummary(
    sessionType: string,
    intensityDescription: string,
    pacingDescription: string,
    powerZones: PowerZoneSeconds | null,
    hrZones: HRZoneSeconds | null,
    cadence: CadenceFeatures | null,
  ): string {
    const parts: string[] = [];

    parts.push(`${sessionType.replace('-', ' ')} ride`);

    if (intensityDescription !== 'unknown') {
      parts.push(`with ${intensityDescription}`);
    }

    if (pacingDescription !== 'unknown') {
      parts.push(`and ${pacingDescription}`);
    }

    if (cadence && cadence.avgCadence != null && cadence.avgCadence < 70 && cadence.lowCadenceClimbingSeconds > 180) {
      parts.push('- significant low-cadence climbing suggests strength focus');
    } else if (cadence && cadence.avgCadence != null && cadence.avgCadence > 90 && !cadence.erraticCadence) {
      parts.push('- efficient spinning with controlled cadence');
    }

    if (powerZones && hrZones) {
      const totalPwr = Object.values(powerZones).reduce((a, b) => a + b, 0);
      const totalHr = Object.values(hrZones).reduce((a, b) => a + b, 0);
      if (totalPwr > 0 && totalHr > 0) {
        const hardPwrPct = (powerZones.z4 + powerZones.z5 + powerZones.z6 + powerZones.z7) / totalPwr;
        const hardHrPct = (hrZones.z4 + hrZones.z5) / totalHr;
        if (hardPwrPct > 0.5 && hardHrPct < 0.3) {
          parts.push('- power output was high relative to heart rate, suggesting good form or short efforts');
        } else if (hardHrPct > 0.5 && hardPwrPct < 0.3) {
          parts.push('- heart rate elevated relative to power, suggesting fatigue or heat');
        }
      }
    }

    return parts.join(' ');
  }
}
