export interface WeeklyProgression {
  weekNumber: number;
  phase: string;
  volumeMultiplier: number;
  intensityMultiplier: number;
  isRecovery: boolean;
  isTaper: boolean;
  targetHours: number;
  targetSessions: number;
}

export interface ProgressionConfig {
  baseHours: number;
  baseSessions: number;
  totalWeeks: number;
  rampRate: number;
  recoveryEveryNWeeks: number;
  taperStartWeek: number;
  recoveryVolumePct: number;
}

const DEFAULT_RAMP_RATE = 0.10;
const DEFAULT_RECOVERY_EVERY = 3;
const DEFAULT_RECOVERY_VOLUME = 0.65;

export function buildProgression(config: ProgressionConfig): WeeklyProgression[] {
  const weeks: WeeklyProgression[] = [];

  for (let w = 1; w <= config.totalWeeks; w++) {
    const isTaper = config.taperStartWeek > 0 && w >= config.taperStartWeek;
    const weeksSinceLastRecovery = getWeeksSinceLastRecovery(weeks);
    const isRecovery = !isTaper && weeksSinceLastRecovery >= config.recoveryEveryNWeeks;

    let volumeMultiplier: number;
    let intensityMultiplier: number;

    if (isTaper) {
      const taperWeek = w - config.taperStartWeek + 1;
      volumeMultiplier = getTaperVolumeMultiplier(taperWeek);
      intensityMultiplier = 0.8;
    } else if (isRecovery) {
      volumeMultiplier = config.recoveryVolumePct;
      intensityMultiplier = 0.5;
    } else {
      const buildWeeks = countBuildWeeks(weeks);
      volumeMultiplier = 1 + buildWeeks * config.rampRate;
      intensityMultiplier = 1 + Math.min(buildWeeks * 0.05, 0.2);
    }

    weeks.push({
      weekNumber: w,
      phase: isTaper ? "taper" : isRecovery ? "recovery" : "build",
      volumeMultiplier: clamp(volumeMultiplier, 0.4, 1.3),
      intensityMultiplier: clamp(intensityMultiplier, 0.4, 1.3),
      isRecovery,
      isTaper,
      targetHours: round1(config.baseHours * clamp(volumeMultiplier, 0.4, 1.3)),
      targetSessions: Math.round(config.baseSessions * clamp(volumeMultiplier, 0.5, 1.2)),
    });
  }

  return weeks;
}

function getWeeksSinceLastRecovery(weeks: WeeklyProgression[]): number {
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].isRecovery) return weeks.length - i;
  }
  return weeks.length + 1;
}

function countBuildWeeks(weeks: WeeklyProgression[]): number {
  let count = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].isRecovery || weeks[i].isTaper) break;
    count++;
  }
  return count;
}

function getTaperVolumeMultiplier(taperWeek: number): number {
  if (taperWeek === 1) return 0.7;
  if (taperWeek === 2) return 0.5;
  return 0.4;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
