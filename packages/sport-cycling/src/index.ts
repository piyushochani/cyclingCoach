export { calculateCyclingZones, ZONE_DESCRIPTIONS } from "./zones.js";
export type { CyclingZoneDisplay } from "./zones.js";

export {
  selectPeriodizationModel,
  computeTotalWeeks,
  BUILD_RECOVERY_RATIOS,
  TAPER_WEEKS,
  PHASE_TEMPLATES,
  VOLUME_PROGRESSION,
  INTENSITY_DISTRIBUTIONS,
  VOLUME_TIERS,
  VOLUME_TIER_MAPPING,
} from "./periodization.js";
export type { PeriodizationModel } from "./periodization.js";

export { assessGoalFeasibility } from "./feasibility.js";
export type { FeasibilityInput, FeasibilityResult } from "./feasibility.js";

export { getSampleWeek } from "./templates.js";
export type { SampleWorkout, WorkoutType } from "./templates.js";

export { buildPlanSkeleton } from "./plan-builder.js";

export { scoreModels, getModelRecommendation } from "./model-scorer.js";
export type { TrainingHistory, ModelScore, ModelRecommendation } from "./model-scorer.js";

export {
  buildConstraints,
  checkConstraints,
  suggestAdjustedDays,
} from "./constraints.js";
export type { AthleteConstraints, ConstraintViolation } from "./constraints.js";

export { buildProgression } from "./load-progressor.js";
export type { WeeklyProgression, ProgressionConfig } from "./load-progressor.js";

export {
  buildTaperSchedule,
  isInTaperWindow,
  shouldReduceIntensity,
} from "./taper.js";
export type { TaperSchedule } from "./taper.js";

export { buildWeekSkeleton, slotWorkouts } from "./workout-slotter.js";
export type { WeekSkeleton, WorkoutSlot, SlottingConfig } from "./workout-slotter.js";

export {
  validateWeekSkeleton,
  validateProgression,
  validateBuildRecovery,
  validateIntensityDistribution,
} from "./plan-validator.js";
export type { ValidationResult, ValidationError, ValidationWarning } from "./plan-validator.js";

export { adjustForMissedSession, suggestFallbackWorkout } from "./plan-adjuster.js";
export type { MissedSession, AdjustmentResult } from "./plan-adjuster.js";

export {
  serializeIntervalsWorkout,
  intervalsWorkoutInputSchema,
  InvalidWorkoutError,
} from "./intervals-serializer.js";
export type { IntervalsWorkoutInput } from "./intervals-serializer.js";

export * from "./schemas.js";

export { cyclingSport, CYCLING_VOCABULARY, ANALYSIS_PROMPTS } from "./sport.js";
export type { AnalysisType } from "./sport.js";
export { migrateCyclingLegacySections } from "./migrate.js";
