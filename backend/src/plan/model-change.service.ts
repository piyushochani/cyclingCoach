import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ModelChangeRecommendation } from './model-change.schema';

export interface SafetyCheckResult {
  passed: boolean;
  notes: string[];
}

export interface ChangeWindowCheck {
  inProtectedWindow: boolean;
  reason: string;
  canChange: boolean;
}

@Injectable()
export class ModelChangeService {
  private readonly logger = new Logger(ModelChangeService.name);

  constructor(
    @InjectModel(ModelChangeRecommendation.name)
    private readonly model: Model<ModelChangeRecommendation>,
  ) {}

  checkChangeWindow(
    weeksUntilRace: number | null,
    raceType?: string,
    isInTaper?: boolean,
    hasInjury?: boolean,
    fatigueLevel?: string,
    confidenceIsHigh?: boolean,
  ): ChangeWindowCheck {
    if (hasInjury) {
      return { inProtectedWindow: true, reason: 'Active injury — no training model changes', canChange: false };
    }

    if (fatigueLevel === 'high') {
      return { inProtectedWindow: true, reason: 'High fatigue — defer model changes', canChange: false };
    }

    if (weeksUntilRace !== null && weeksUntilRace !== undefined) {
      if (weeksUntilRace <= 2) {
        return { inProtectedWindow: true, reason: 'Within 2 weeks of race — protected window', canChange: false };
      }
      if (isInTaper) {
        return { inProtectedWindow: true, reason: 'Currently in taper — no model changes allowed', canChange: false };
      }
    }

    if (confidenceIsHigh === false) {
      return { inProtectedWindow: false, reason: 'Confidence too low for safe change', canChange: false };
    }

    return { inProtectedWindow: false, reason: 'Safe to change', canChange: true };
  }

  async createRecommendation(
    userId: string,
    previousModel: string,
    suggestedModel: string,
    reason: string,
    confidenceScore: string,
    safetyCheck: SafetyCheckResult,
  ): Promise<ModelChangeRecommendation> {
    const existing = await this.model.findOne({
      user: userId as any,
      status: 'pending',
    }).exec();

    if (existing) {
      existing.previousModel = previousModel;
      existing.suggestedModel = suggestedModel;
      existing.reason = reason;
      existing.confidenceScore = confidenceScore;
      existing.triggeredAt = new Date();
      existing.safetyCheckPassed = safetyCheck.passed;
      existing.safetyCheckNotes = safetyCheck.notes.join('; ');
      return existing.save();
    }

    return this.model.create({
      user: userId as any,
      previousModel,
      suggestedModel,
      reason,
      confidenceScore,
      safetyCheckPassed: safetyCheck.passed,
      safetyCheckNotes: safetyCheck.notes.join('; '),
    });
  }

  async respondToRecommendation(
    userId: string,
    recommendationId: string,
    decision: 'accepted' | 'declined' | 'snoozed',
  ): Promise<ModelChangeRecommendation | null> {
    const rec = await this.model.findOne({
      _id: recommendationId as any,
      user: userId as any,
      status: 'pending',
    }).exec();

    if (!rec) return null;

    rec.userDecision = decision;
    rec.status = decision;
    if (decision === 'accepted') rec.appliedAt = new Date();
    if (decision === 'declined') rec.dismissedAt = new Date();

    return rec.save();
  }

  async tryAutoApply(
    userId: string,
    weeksUntilRace: number | null,
    isInTaper: boolean,
    hasInjury: boolean,
    fatigueLevel: string,
  ): Promise<{ applied: boolean; recommendation?: ModelChangeRecommendation; reason: string }> {
    const windowCheck = this.checkChangeWindow(
      weeksUntilRace, undefined, isInTaper, hasInjury, fatigueLevel, true,
    );
    if (!windowCheck.canChange) {
      return { applied: false, reason: windowCheck.reason };
    }

    const pending = await this.model.findOne({
      user: userId as any,
      status: 'pending',
      confidenceScore: 'high',
    }).sort({ triggeredAt: -1 }).exec();

    if (!pending) {
      return { applied: false, reason: 'No high-confidence pending recommendation' };
    }

    pending.status = 'auto-applied';
    pending.isAutoApplied = true;
    pending.appliedAt = new Date();
    await pending.save();

    this.logger.log(`Auto-applied model change for user ${userId}: ${pending.previousModel} -> ${pending.suggestedModel}`);
    return { applied: true, recommendation: pending, reason: 'Auto-applied under strict safety rules' };
  }

  async getRecommendationHistory(userId: string): Promise<ModelChangeRecommendation[]> {
    return this.model.find({ user: userId as any })
      .sort({ triggeredAt: -1 })
      .limit(20)
      .lean()
      .exec();
  }

  async getPendingRecommendation(userId: string): Promise<ModelChangeRecommendation | null> {
    return this.model.findOne({
      user: userId as any,
      status: 'pending',
    }).exec();
  }
}
