import type { WorkoutSlot } from "./workout-slotter.js";

export interface MissedSession {
  day: string;
  workoutType: string;
}

export interface AdjustmentResult {
  suggestions: string[];
  adjustedRemaining: WorkoutSlot[];
}

export function adjustForMissedSession(
  missed: MissedSession,
  remaining: WorkoutSlot[],
  daysUntilRace: number,
  isInTaper: boolean,
): AdjustmentResult {
  const suggestions: string[] = [];
  const adjusted = remaining.filter((s) => s.day !== missed.day);

  if (missed.workoutType === "long_ride") {
    if (isInTaper) {
      suggestions.push("Skip the long ride — it's too close to race day to reschedule.");
    } else {
      const nextLongDay = remaining.find(
        (s) => s.day !== missed.day && s.workoutType === "long_ride",
      );
      if (nextLongDay) {
        suggestions.push(`Merge missed long ride intent into ${nextLongDay.day}'s session — add 30min Z2.`);
      } else {
        const nextEndurance = remaining.find(
          (s) => s.day !== missed.day && s.workoutType === "endurance",
        );
        if (nextEndurance) {
          suggestions.push(`Extend ${nextEndurance.day}'s endurance ride by 20-30min to recover some volume.`);
        }
      }
    }
  }

  if (missed.workoutType === "threshold_intervals" || missed.workoutType === "vo2max_intervals") {
    if (isInTaper) {
      suggestions.push("Skip missed intensity session — rest is more important now.");
    } else if (daysUntilRace > 7) {
      const nextHardDay = remaining.find((s) => s.isKey && s.day !== missed.day);
      if (nextHardDay) {
        suggestions.push(`Shift interval work to ${nextHardDay.day} — combine with that session if compatible.`);
      } else {
        suggestions.push("No compatible key session remaining this week. Reduce intensity in next endurance ride instead.");
      }
    } else {
      suggestions.push("Skip missed intensity — it's too close to race day. Keep the remaining sessions easy.");
    }
  }

  if (missed.workoutType === "endurance" || missed.workoutType === "recovery") {
    if (remaining.length > 0) {
      const nextRide = remaining.find((s) => s.day !== missed.day);
      if (nextRide && !isInTaper) {
        suggestions.push(`Add 15-20min Z2 to ${nextRide.day}'s ride to offset missed volume.`);
      } else {
        suggestions.push("No adjustment needed — the other sessions provide enough stimulus.");
      }
    }
  }

  return { suggestions, adjustedRemaining: adjusted };
}

export function suggestFallbackWorkout(
  missedWorkoutType: string,
  availableMinutes: number,
): { type: string; description: string } {
  if (availableMinutes < 30) {
    return { type: "short_spin", description: "20-30min Z1 spin to maintain blood flow" };
  }

  switch (missedWorkoutType) {
    case "long_ride":
      return {
        type: "endurance",
        description: `${availableMinutes}min Z2 ride — not a full replacement but maintains rhythm`,
      };
    case "threshold_intervals":
      return {
        type: "sweet_spot",
        description: `${Math.floor(availableMinutes / 3)}×${Math.floor(availableMinutes / 4)}min Z4 at 88-94% with equal rest`,
      };
    case "vo2max_intervals":
      return {
        type: "threshold",
        description: `${Math.floor(availableMinutes / 4)}×${Math.floor(availableMinutes / 3)}min Z5 with 3min Z1 recovery`,
      };
    case "tempo":
      return {
        type: "tempo",
        description: `${availableMinutes}min Z3 continuous`,
      };
    default:
      return {
        type: "endurance",
        description: `${availableMinutes}min Z2 endurance`,
      };
  }
}
