import type { RaceType, DayOfWeek } from "./schemas.js";

export interface TaperSchedule {
  totalTaperWeeks: number;
  weeklyVolumePcts: number[];
  intensityMaintained: boolean;
  openersDay: DayOfWeek | null;
  lastHardDay: DayOfWeek | null;
}

export const TAPER_WEEKS_BY_RACE: Record<RaceType, number> = {
  century: 2,
  gran_fondo: 2,
  criterium: 1,
  time_trial: 1,
  other: 1,
};

const VOLUME_REDUCTION: Record<number, number> = {
  1: 0.7,
  2: 0.5,
};

export function buildTaperSchedule(
  raceType: RaceType,
  startWeekDay: DayOfWeek = "mon",
): TaperSchedule {
  const totalTaperWeeks = TAPER_WEEKS_BY_RACE[raceType] ?? 1;
  const weeklyVolumePcts: number[] = [];

  for (let i = 1; i <= totalTaperWeeks; i++) {
    weeklyVolumePcts.push(VOLUME_REDUCTION[i] ?? 0.4);
  }

  const raceDayIndex = getDayIndex(startWeekDay);
  const openersDayIndex = (raceDayIndex - 2 + 7) % 7;
  const lastHardDayIndex = (raceDayIndex - 4 + 7) % 7;

  return {
    totalTaperWeeks,
    weeklyVolumePcts,
    intensityMaintained: true,
    openersDay: indexToDay(openersDayIndex),
    lastHardDay: indexToDay(lastHardDayIndex),
  };
}

export function isInTaperWindow(weeksUntilRace: number, raceType: RaceType): boolean {
  const taperWeeks = TAPER_WEEKS_BY_RACE[raceType] ?? 1;
  return weeksUntilRace <= taperWeeks && weeksUntilRace > 0;
}

export function shouldReduceIntensity(weekOfTaper: number): boolean {
  return weekOfTaper >= 1;
}

const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function getDayIndex(day: DayOfWeek): number {
  return DAY_ORDER.indexOf(day);
}

function indexToDay(index: number): DayOfWeek {
  return DAY_ORDER[((index % 7) + 7) % 7];
}
