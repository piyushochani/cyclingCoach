import type { WeekSkeleton } from "./workout-slotter.js";
import type { AthleteConstraints, ConstraintViolation } from "./constraints.js";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export function validateWeekSkeleton(
  skeleton: WeekSkeleton,
  constraints: AthleteConstraints,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (skeleton.totalVolumeTargetHours <= 0) {
    errors.push({ field: "totalVolumeTargetHours", message: "Volume target must be positive" });
  }

  if (skeleton.totalVolumeTargetHours > constraints.maxWeeklyHours) {
    errors.push({
      field: "totalVolumeTargetHours",
      message: `Volume ${skeleton.totalVolumeTargetHours}h exceeds max ${constraints.maxWeeklyHours}h`,
    });
  }

  if (skeleton.keySessions.length === 0) {
    warnings.push({ field: "keySessions", message: "No key sessions defined" });
  }

  if (skeleton.recoveryDays.length < 1) {
    warnings.push({ field: "recoveryDays", message: "At least 1 recovery day recommended" });
  }

  if (skeleton.isTaper && skeleton.totalVolumeTargetHours > 0.75 * 10) {
    warnings.push({
      field: "totalVolumeTargetHours",
      message: "Taper week should have reduced volume",
    });
  }

  if (skeleton.longRideTarget > skeleton.totalVolumeTargetHours * 0.5) {
    warnings.push({
      field: "longRideTarget",
      message: "Long ride should not exceed 50% of weekly volume",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateProgression(
  currentWeekVolume: number,
  previousWeekVolume: number,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (previousWeekVolume > 0) {
    const increase = (currentWeekVolume - previousWeekVolume) / previousWeekVolume;
    if (increase > 0.10) {
      errors.push({
        field: "volumeIncrease",
        message: `Week-over-week increase of ${(increase * 100).toFixed(0)}% exceeds 10% max`,
      });
    }
    if (increase > 0.05 && increase <= 0.10) {
      warnings.push({
        field: "volumeIncrease",
        message: `Week-over-week increase of ${(increase * 100).toFixed(0)}% is at upper limit`,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateBuildRecovery(
  buildWeeks: number,
  recoveryWeekScheduled: boolean,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (buildWeeks >= 3 && !recoveryWeekScheduled) {
    errors.push({
      field: "recovery",
      message: `${buildWeeks} build weeks without recovery — max 3 build weeks before recovery`,
    });
  }

  if (buildWeeks >= 2 && !recoveryWeekScheduled && buildWeeks < 3) {
    warnings.push({
      field: "recovery",
      message: `${buildWeeks} build weeks without recovery — schedule soon`,
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateIntensityDistribution(
  hardDays: number,
  totalDays: number,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const hardRatio = totalDays > 0 ? hardDays / totalDays : 0;
  if (hardRatio > 0.4) {
    warnings.push({
      field: "intensityDistribution",
      message: `${(hardRatio * 100).toFixed(0)}% hard days — recommended max 40%`,
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}
