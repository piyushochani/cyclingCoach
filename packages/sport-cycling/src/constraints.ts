import type { DayOfWeek } from "./schemas.js";

export interface AthleteConstraints {
  protectedDays: DayOfWeek[];
  maxSessionDurationMinutes: number;
  maxWeeklyHours: number;
  injuryFlags: string[];
  fatigueLevel: "low" | "moderate" | "high";
  hasTimeCrunched: boolean;
}

export interface ConstraintViolation {
  type: "overlap" | "overduration" | "overvolume" | "injury_blocked" | "protected_day";
  message: string;
  severity: "warning" | "error";
}

export function buildConstraints(
  availableDays: DayOfWeek[] | undefined,
  sessionsPerWeek: number | undefined,
  needsExtraRecovery: boolean,
  maxSessionMinutes: number = 180,
): AthleteConstraints {
  return {
    protectedDays: [],
    maxSessionDurationMinutes: maxSessionMinutes,
    maxWeeklyHours: needsExtraRecovery ? 8 : 15,
    injuryFlags: [],
    fatigueLevel: needsExtraRecovery ? "high" : "low",
    hasTimeCrunched: !availableDays || availableDays.length <= 3,
  };
}

export function checkConstraints(
  proposedDays: DayOfWeek[],
  sessionMinutes: number,
  constraints: AthleteConstraints,
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  if (sessionMinutes > constraints.maxSessionDurationMinutes) {
    violations.push({
      type: "overduration",
      message: `Session ${sessionMinutes}min exceeds max ${constraints.maxSessionDurationMinutes}min`,
      severity: "error",
    });
  }

  if (constraints.fatigueLevel === "high" && proposedDays.length > 4) {
    violations.push({
      type: "overvolume",
      message: `High fatigue — max 4 sessions/week recommended, got ${proposedDays.length}`,
      severity: "warning",
    });
  }

  for (const day of proposedDays) {
    if (constraints.protectedDays.includes(day)) {
      violations.push({
        type: "protected_day",
        message: `${day} is a protected day`,
        severity: "warning",
      });
    }
  }

  if (constraints.injuryFlags.length > 0 && proposedDays.length > 3) {
    violations.push({
      type: "injury_blocked",
      message: `Active injuries (${constraints.injuryFlags.join(", ")}) — reduce session count`,
      severity: "error",
    });
  }

  return violations;
}

export function suggestAdjustedDays(
  availableDays: DayOfWeek[],
  targetCount: number,
  constraints: AthleteConstraints,
): DayOfWeek[] {
  const usable = availableDays.filter((d) => !constraints.protectedDays.includes(d));
  const maxAllowed = Math.min(
    targetCount,
    constraints.fatigueLevel === "high" ? 4 : 7,
    constraints.injuryFlags.length > 0 ? 3 : 7,
  );
  return usable.slice(0, maxAllowed);
}
