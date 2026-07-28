import type { DayOfWeek } from "./schemas.js";

export interface WorkoutSlot {
  day: DayOfWeek;
  workoutType: string;
  durationMinutes: number;
  isKey: boolean;
}

export interface WeekSkeleton {
  weekNumber: number;
  phase: string;
  totalVolumeTargetHours: number;
  intensityDistribution: string;
  keySessions: string[];
  recoveryDays: DayOfWeek[];
  longRideTarget: number;
  isTaper: boolean;
  notes: string;
}

export interface SlottingConfig {
  availableDays: DayOfWeek[];
  sessionsPerWeek: number;
  keySessionDay: DayOfWeek | undefined;
  longRideDay: DayOfWeek;
  phase: string;
  isTaper: boolean;
}

const LONG_RIDE_DEFAULT: DayOfWeek = "sun";
const KEY_SESSION_FALLBACK: DayOfWeek = "wed";

export function buildWeekSkeleton(
  weekNumber: number,
  phase: string,
  totalVolumeHours: number,
  intensityDistribution: string,
  sessionsPerWeek: number,
  isTaper: boolean,
): WeekSkeleton {
  const allDays: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  // Monday is always rest
  const recoveryDays: DayOfWeek[] = ["mon"];

  // Fill remaining recovery days from the end, skipping Sunday (long ride day)
  const recoveryCount = isTaper ? 3 : Math.max(1, 7 - sessionsPerWeek);
  let idx = allDays.length - 2; // start from sat, skip sun
  for (let i = 0; i < recoveryCount - 1 && idx >= 1; i++) {
    if (allDays[idx] !== "mon" && allDays[idx] !== "sun") {
      recoveryDays.push(allDays[idx]);
    }
    idx--;
  }

  const keySessions = deriveKeySessions(phase);

  return {
    weekNumber,
    phase,
    totalVolumeTargetHours: totalVolumeHours,
    intensityDistribution,
    keySessions,
    recoveryDays,
    longRideTarget: isTaper ? totalVolumeHours * 0.4 : totalVolumeHours * 0.35,
    isTaper,
    notes: isTaper ? "Taper week — reduce volume, maintain intensity" : "",
  };
}

export function slotWorkouts(
  config: SlottingConfig,
): WorkoutSlot[] {
  const { availableDays, sessionsPerWeek, keySessionDay, phase, isTaper } = config;
  const slots: WorkoutSlot[] = [];
  const usedDays = new Set<string>();
  const orderedDays = [...availableDays];

  // Monday is always rest — remove from available
  const filtered: DayOfWeek[] = orderedDays.filter((d) => d !== "mon");
  if (filtered.length === 0) {
    filtered.push("tue", "wed", "fri");
  }

  // Sunday is always long ride
  const longRideDay: DayOfWeek = "sun";
  if (filtered.includes(longRideDay)) {
    slots.push({
      day: longRideDay,
      workoutType: "long_ride",
      durationMinutes: isTaper ? 90 : 180,
      isKey: true,
    });
    usedDays.add(longRideDay);
  }

  const keyDay = keySessionDay ?? KEY_SESSION_FALLBACK;
  if (keyDay && filtered.includes(keyDay) && !usedDays.has(keyDay)) {
    slots.push({
      day: keyDay,
      workoutType: deriveKeySessionType(phase),
      durationMinutes: isTaper ? 60 : 90,
      isKey: true,
    });
    usedDays.add(keyDay);
  }

  const remaining = filtered.filter((d) => !usedDays.has(d));
  const remainingCount = Math.max(0, sessionsPerWeek - slots.length);

  for (let i = 0; i < Math.min(remainingCount, remaining.length); i++) {
    const day = remaining[i];
    const isEndurance = i === remaining.length - 1 && slots.length < 2;
    slots.push({
      day,
      workoutType: isEndurance ? "endurance" : i % 2 === 0 ? "tempo" : "recovery",
      durationMinutes: isTaper ? 45 : 75,
      isKey: false,
    });
    usedDays.add(day);
  }

  return slots.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
}

function deriveKeySessions(phase: string): string[] {
  const map: Record<string, string[]> = {
    base_building: ["endurance", "tempo"],
    aerobic_development: ["long_ride", "tempo"],
    threshold: ["threshold_intervals", "sweet_spot"],
    vo2max: ["vo2max_intervals", "threshold"],
    race_prep: ["race_simulation", "threshold"],
    taper: ["openers", "threshold_short"],
  };
  return map[phase] ?? ["endurance"];
}

function deriveKeySessionType(phase: string): string {
  const sessions = deriveKeySessions(phase);
  return sessions[0] ?? "threshold";
}

const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
