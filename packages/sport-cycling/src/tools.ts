import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { MemoryStore, StravaClient } from "@enduragent/core";
import {
  calculateCyclingZones,
  buildPlanSkeleton,
  assessGoalFeasibility,
  getSampleWeek,
  buildConstraints,
  validateWeekSkeleton,
  buildTaperSchedule,
  adjustForMissedSession,
  suggestFallbackWorkout,
  buildWeekSkeleton,
  scoreModels,
  getModelRecommendation,
} from "./index.js";
import type {
  AthleteProfile,
  ExperienceLevel,
  VolumeTier,
  DayOfWeek,
  RaceType,
} from "./index.js";

const daysEnum = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

/**
 * Pure-Sport cycling tools per ADR-0004 — sport-specific math (FTP zones,
 * periodized plan-skeleton). Strava Pure-Core tools live in `@enduragent/core`.
 */
export function createCyclingTools(
  memory: MemoryStore,
  strava: StravaClient | null,
  tz: string = "UTC",
) {
  // Strava client is available for future sport-specific Strava tools.
  void strava;

  return {
    calculate_zones: tool({
      description: "Calculate 6 power zones from FTP watts",
      inputSchema: zodSchema(
        z.object({
          ftpWatts: z.number().int().min(50).max(600).describe("FTP in watts"),
        }),
      ),
      execute: async (input: { ftpWatts: number }) => calculateCyclingZones(input.ftpWatts),
    }),

    build_plan_skeleton: tool({
      description:
        "Build a periodized training plan skeleton from athlete profile. Returns phases, volume targets, zone tables, and testing protocols.",
      inputSchema: zodSchema(
        z.object({
          experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]),
          ftpWatts: z.number().int().min(50).max(600),
          weightKg: z.number().positive().optional(),
          volumeTier: z.enum(["low", "medium", "high"]),
          scheduleType: z.enum(["fixed", "flexible"]),
          availableDays: z.array(daysEnum).optional(),
          keySessionDay: daysEnum.optional(),
          sessionsPerWeek: z.number().int().min(3).max(6).optional(),
          goalType: z.enum(["race", "general"]),
          raceType: z
            .enum(["century", "gran_fondo", "criterium", "time_trial", "other"])
            .optional(),
          raceDate: z.string().optional(),
          targetTime: z.string().optional(),
          generalGoal: z.string().optional(),
          generalGoalTarget: z.string().optional(),
        }),
      ),
      execute: async (params: {
        experienceLevel: ExperienceLevel;
        ftpWatts: number;
        weightKg?: number;
        volumeTier: VolumeTier;
        scheduleType: "fixed" | "flexible";
        availableDays?: DayOfWeek[];
        keySessionDay?: DayOfWeek;
        sessionsPerWeek?: number;
        goalType: "race" | "general";
        raceType?: RaceType;
        raceDate?: string;
        targetTime?: string;
        generalGoal?: string;
        generalGoalTarget?: string;
      }) => {
        const profile: AthleteProfile = { ...params, needsExtraRecovery: false };
        const plan = buildPlanSkeleton(profile, tz);
        memory.savePlan(plan);
        return plan;
      },
    }),

    assess_feasibility: tool({
      description:
        "Assess whether an FTP or W/kg target is realistic given current fitness and experience level",
      inputSchema: zodSchema(
        z.object({
          currentFtp: z.number().int().min(50).max(600),
          targetFtp: z.number().int().optional(),
          targetWkg: z.number().optional(),
          currentWeightKg: z.number().positive().optional(),
          experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]),
        }),
      ),
      execute: async (params: {
        currentFtp: number;
        targetFtp?: number;
        targetWkg?: number;
        currentWeightKg?: number;
        experienceLevel: ExperienceLevel;
      }) => {
        const result = assessGoalFeasibility(params);
        return result ?? { message: "Goal appears achievable within one plan cycle." };
      },
    }),

    get_sample_week: tool({
      description: "Get a sample training week for a given volume tier and schedule type",
      inputSchema: zodSchema(
        z.object({
          volumeTier: z.enum(["low", "medium", "high"]),
          scheduleType: z.enum(["fixed", "flexible"]),
          availableDays: z.array(daysEnum).optional(),
          keySessionDay: daysEnum.optional(),
          sessionsPerWeek: z.number().int().min(3).max(6).optional(),
        }),
      ),
      execute: async (params: {
        volumeTier: VolumeTier;
        scheduleType: "fixed" | "flexible";
        availableDays?: DayOfWeek[];
        keySessionDay?: DayOfWeek;
        sessionsPerWeek?: number;
      }) =>
        getSampleWeek(
          params.volumeTier,
          params.scheduleType,
          params.availableDays,
          params.keySessionDay,
          params.sessionsPerWeek,
        ),
    }),

    validate_week_structure: tool({
      description:
        "Validate a proposed week skeleton against athlete constraints and progression rules. Returns errors and warnings before saving.",
      inputSchema: zodSchema(
        z.object({
          weekNumber: z.number().int().positive(),
          phase: z.string(),
          totalVolumeTargetHours: z.number().positive(),
          keySessions: z.array(z.string()),
          recoveryDays: z.array(daysEnum),
          isTaper: z.boolean(),
          longRideTarget: z.number().nonnegative(),
          availableDays: z.array(daysEnum),
          needsExtraRecovery: z.boolean().optional(),
        }),
      ),
      execute: async (params: {
        weekNumber: number;
        phase: string;
        totalVolumeTargetHours: number;
        keySessions: string[];
        recoveryDays: DayOfWeek[];
        isTaper: boolean;
        longRideTarget: number;
        availableDays: DayOfWeek[];
        needsExtraRecovery?: boolean;
      }) => {
        const constraints = buildConstraints(
          params.availableDays,
          params.availableDays.length,
          params.needsExtraRecovery ?? false,
        );
        const skeleton = buildWeekSkeleton(
          params.weekNumber,
          params.phase,
          params.totalVolumeTargetHours,
          "",
          params.availableDays.length,
          params.isTaper,
        );
        skeleton.keySessions = params.keySessions;
        skeleton.recoveryDays = params.recoveryDays;
        skeleton.longRideTarget = params.longRideTarget;

        const result = validateWeekSkeleton(skeleton, constraints);
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
          summary: result.valid
            ? "Week structure is valid."
            : `Week structure has ${result.errors.length} error(s).`,
        };
      },
    }),

    build_taper_week: tool({
      description:
        "Build a deterministic taper schedule for a race. Returns volume reduction percentages and key session placement.",
      inputSchema: zodSchema(
        z.object({
          raceType: z.enum(["century", "gran_fondo", "criterium", "time_trial", "other"]),
          startWeekDay: daysEnum.default("mon").optional(),
        }),
      ),
      execute: async (params: {
        raceType: RaceType;
        startWeekDay?: DayOfWeek;
      }) => {
        const taper = buildTaperSchedule(params.raceType, params.startWeekDay);
        return {
          totalTaperWeeks: taper.totalTaperWeeks,
          weeklyVolumePcts: taper.weeklyVolumePcts,
          intensityMaintained: taper.intensityMaintained,
          openersDay: taper.openersDay,
          lastHardDay: taper.lastHardDay,
          recommendation: `${taper.totalTaperWeeks}-week taper. Volume reduces to ${taper.weeklyVolumePcts.map((p) => `${Math.round(p * 100)}%`).join(", ")} of peak. Maintain intensity.`,
        };
      },
    }),

    adjust_plan_for_missed_sessions: tool({
      description:
        "Suggest adjustments when an athlete misses a planned workout. Returns fallback options and schedule modifications.",
      inputSchema: zodSchema(
        z.object({
          missedDay: daysEnum,
          missedWorkoutType: z.string(),
          remainingDays: z.array(daysEnum),
          remainingWorkoutTypes: z.array(z.string()),
          daysUntilRace: z.number().int().nonnegative(),
          isInTaper: z.boolean(),
          availableMinutes: z.number().int().positive().optional(),
        }),
      ),
      execute: async (params: {
        missedDay: DayOfWeek;
        missedWorkoutType: string;
        remainingDays: DayOfWeek[];
        remainingWorkoutTypes: string[];
        daysUntilRace: number;
        isInTaper: boolean;
        availableMinutes?: number;
      }) => {
        const remaining = params.remainingDays.map((day, i) => ({
          day,
          workoutType: params.remainingWorkoutTypes[i] ?? "endurance",
          durationMinutes: 60,
          isKey: false,
        }));

        const result = adjustForMissedSession(
          { day: params.missedDay, workoutType: params.missedWorkoutType },
          remaining,
          params.daysUntilRace,
          params.isInTaper,
        );

        const fallback = params.availableMinutes
          ? suggestFallbackWorkout(params.missedWorkoutType, params.availableMinutes)
          : null;

        return {
          suggestions: result.suggestions,
          adjustedRemaining: result.adjustedRemaining.map((s) => ({
            day: s.day,
            workoutType: s.workoutType,
          })),
          fallbackWorkout: fallback,
        };
      },
    }),

    assess_model_fit: tool({
      description:
        "Score all periodisation models against athlete training history. Returns ranked scores, a recommendation, and confidence level. Use before building a plan to select the best model.",
      inputSchema: zodSchema(
        z.object({
          experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]),
          totalWeeksAvailable: z.number().int().positive(),
          volumeTier: z.enum(["low", "medium", "high"]),
          goalType: z.enum(["race", "general"]),
          consistencyScore: z.number().min(0).max(1).describe("0-1 how consistently they train"),
          adherenceRate: z.number().min(0).max(1).describe("0-1 how well they follow plans"),
          ftpTrend: z.enum(["improving", "stable", "declining"]),
          toleratesHighLoad: z.boolean(),
          improvesWithSteadyProgression: z.boolean(),
          improvesWithConcentratedLoad: z.boolean(),
          tapersHelp: z.boolean(),
          recoversWell: z.boolean(),
          pastModelUsed: z.string().optional(),
          pastModelResponse: z.enum(["good", "neutral", "poor"]).optional(),
          hasRaceGoal: z.boolean(),
          weeksUntilRace: z.number().int().nonnegative().optional(),
          raceType: z.string().optional(),
        }),
      ),
      execute: async (params: {
        experienceLevel: "beginner" | "intermediate" | "advanced" | "elite";
        totalWeeksAvailable: number;
        volumeTier: "low" | "medium" | "high";
        goalType: "race" | "general";
        consistencyScore: number;
        adherenceRate: number;
        ftpTrend: "improving" | "stable" | "declining";
        toleratesHighLoad: boolean;
        improvesWithSteadyProgression: boolean;
        improvesWithConcentratedLoad: boolean;
        tapersHelp: boolean;
        recoversWell: boolean;
        pastModelUsed?: string;
        pastModelResponse?: "good" | "neutral" | "poor";
        hasRaceGoal: boolean;
        weeksUntilRace?: number;
        raceType?: string;
      }) => {
        const recommendation = getModelRecommendation({
          experienceLevel: params.experienceLevel,
          totalWeeksAvailable: params.totalWeeksAvailable,
          volumeTier: params.volumeTier,
          goalType: params.goalType,
          consistencyScore: params.consistencyScore,
          adherenceRate: params.adherenceRate,
          ftpTrend: params.ftpTrend,
          toleratesHighLoad: params.toleratesHighLoad,
          improvesWithSteadyProgression: params.improvesWithSteadyProgression,
          improvesWithConcentratedLoad: params.improvesWithConcentratedLoad,
          tapersHelp: params.tapersHelp,
          recoversWell: params.recoversWell,
          pastModelUsed: (params.pastModelUsed as any) ?? undefined,
          pastModelResponse: params.pastModelResponse,
          hasRaceGoal: params.hasRaceGoal,
          weeksUntilRace: params.weeksUntilRace ?? 52,
          raceType: params.raceType,
        });

        return {
          currentModel: recommendation.currentModel,
          recommendedModel: recommendation.recommendedModel,
          confidence: recommendation.confidence,
          isChangeRecommended: recommendation.isChangeRecommended,
          scores: recommendation.scores.map((s) => ({
            model: s.model,
            score: s.score,
            topReasons: s.reasons.slice(0, 3),
          })),
          reasons: recommendation.reasons,
        };
      },
    }),
  };
}
