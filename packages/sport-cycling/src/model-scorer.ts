import type { PeriodizationModel } from "./periodization.js";
import type { ExperienceLevel } from "./schemas.js";

export interface TrainingHistory {
  experienceLevel: ExperienceLevel;
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
  pastModelUsed?: PeriodizationModel;
  pastModelResponse?: "good" | "neutral" | "poor";
  hasRaceGoal: boolean;
  weeksUntilRace: number;
  raceType?: string;
}

export interface ModelScore {
  model: PeriodizationModel;
  score: number;
  reasons: string[];
}

export interface ModelRecommendation {
  currentModel: PeriodizationModel;
  recommendedModel: PeriodizationModel;
  scores: ModelScore[];
  confidence: "low" | "medium" | "high";
  isChangeRecommended: boolean;
  reasons: string[];
}

const MODELS: PeriodizationModel[] = [
  "linear",
  "block",
  "reverse_linear",
  "polarized",
  "pyramidal",
];

export function scoreModels(history: TrainingHistory): ModelScore[] {
  const scores: ModelScore[] = MODELS.map((model) => {
    const reasons: string[] = [];
    let score = 50;

    const addReason = (delta: number, reason: string) => {
      score += delta;
      reasons.push(reason);
    };

    if (history.experienceLevel === "beginner") {
      if (model === "linear") addReason(25, "beginner-friendly simple progression");
      if (model === "block") addReason(-10, "block periodisation too complex for beginner");
      if (model === "polarized") addReason(-5, "polarized requires discipline");
    }

    if (history.experienceLevel === "advanced" || history.experienceLevel === "elite") {
      if (model === "polarized") addReason(15, "advanced athlete suited for polarized");
      if (model === "pyramidal") addReason(10, "versatile for advanced training");
      if (model === "linear") addReason(-10, "linear too simplistic for advanced athlete");
    }

    if (history.totalWeeksAvailable <= 8) {
      if (model === "reverse_linear") addReason(20, "short build — prioritise intensity early");
      if (model === "linear") addReason(-15, "too many base weeks for short timeline");
      if (model === "pyramidal") addReason(-5, "pyramidal needs more weeks to unfold");
    }

    if (history.totalWeeksAvailable > 16) {
      if (model === "pyramidal") addReason(10, "pyramidal excels with longer timeline");
      if (model === "linear") addReason(5, "linear works well with ample time");
    }

    if (history.consistencyScore > 0.7) {
      if (model === "block") addReason(15, "consistent athlete can handle block loading");
      if (model === "polarized") addReason(10, "consistent athlete maintains polarized discipline");
    }

    if (history.consistencyScore < 0.4) {
      if (model === "linear") addReason(20, "inconsistent — simpler linear model fits");
      if (model === "block") addReason(-15, "inconsistent athlete struggles with block structure");
    }

    if (history.adherenceRate > 0.8) {
      if (model === "polarized") addReason(5, "high adherence suits polarized structure");
    } else if (history.adherenceRate < 0.5) {
      if (model === "linear") addReason(10, "low adherence — simpler structure helps");
    }

    if (history.ftpTrend === "improving") {
      addReason(5, "improving fitness — any model can work");
      if (model === history.pastModelUsed) addReason(10, "current model is producing results");
    }

    if (history.ftpTrend === "declining") {
      if (model !== history.pastModelUsed) addReason(10, "may need change from current model");
      if (model === "linear") addReason(5, "linear may help rebuild consistency");
    }

    if (history.toleratesHighLoad && history.improvesWithConcentratedLoad) {
      if (model === "block") addReason(20, "responds well to concentrated loading");
    }

    if (!history.toleratesHighLoad && history.improvesWithSteadyProgression) {
      if (model === "linear") addReason(15, "prefers steady, manageable progression");
      if (model === "pyramidal") addReason(10, "pyramidal spreads load evenly");
    }

    if (history.recoversWell) {
      if (model === "block") addReason(5, "good recovery supports block structure");
    }

    if (!history.recoversWell) {
      if (model === "polarized") addReason(10, "polarized has large easy volume for recovery");
      if (model === "linear") addReason(5, "linear progression is gentler");
    }

    if (history.tapersHelp) {
      addReason(3, "responds well to taper — all models benefit");
    }

    if (history.pastModelUsed === model && history.pastModelResponse === "good") {
      addReason(15, "past success with this model");
    }

    if (history.pastModelUsed === model && history.pastModelResponse === "poor") {
      addReason(-20, "previously poor response to this model");
    }

    if (history.hasRaceGoal && history.raceType) {
      if (history.raceType === "century" || history.raceType === "gran_fondo") {
        if (model === "polarized") addReason(10, "polarized builds endurance for long events");
        if (model === "linear") addReason(5, "linear builds solid aerobic base");
      }
      if (history.raceType === "criterium" || history.raceType === "time_trial") {
        if (model === "block") addReason(15, "block suits shorter high-intensity events");
        if (model === "reverse_linear") addReason(10, "reverse linear peaks intensity quickly");
      }
    }

    if (history.volumeTier === "high") {
      if (model === "polarized") addReason(10, "high volume suits polarized distribution");
      if (model === "pyramidal") addReason(5, "high volume can spread across zones");
    }

    if (history.volumeTier === "low") {
      if (model === "linear") addReason(10, "low volume — linear maximises limited time");
    }

    return { model, score: Math.max(0, Math.min(100, score)), reasons };
  });

  return scores.sort((a, b) => b.score - a.score);
}

export function getModelRecommendation(
  history: TrainingHistory,
): ModelRecommendation {
  const scores = scoreModels(history);
  const top = scores[0];
  const second = scores[1];

  const currentModel = history.pastModelUsed ?? "pyramidal";
  const scoreGap = top.score - (scores.find((s) => s.model === currentModel)?.score ?? 0);
  const confidence: "low" | "medium" | "high" =
    scoreGap > 20 ? "high" : scoreGap > 10 ? "medium" : "low";

  const reasons: string[] = [];
  if (top.model !== currentModel) {
    reasons.push(`${top.model} scores ${top.score} vs ${currentModel} at ${scores.find((s) => s.model === currentModel)?.score ?? 0}`);
    reasons.push(`gap of ${scoreGap} points suggests ${confidence} confidence`);
  } else {
    reasons.push(`current model ${currentModel} is the best fit (score: ${top.score})`);
  }

  return {
    currentModel,
    recommendedModel: top.model,
    scores,
    confidence,
    isChangeRecommended: top.model !== currentModel && confidence !== "low",
    reasons,
  };
}
