"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "cycloai_model_change_recommendation";
const SNOOZE_DURATION = 3 * 24 * 60 * 60 * 1000;

function loadRecommendation() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function saveRecommendation(rec) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
}

function clearRecommendation() {
  localStorage.removeItem(STORAGE_KEY);
}

const ModelChangeBanner = () => {
  const [rec, setRec] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = loadRecommendation();
    if (!stored || stored.userDecision === "applied" || stored.userDecision === "dismissed") {
      setRec(null);
      setVisible(false);
      return;
    }
    if (stored.userDecision === "snoozed") {
      const snoozedUntil = stored.snoozedUntil || 0;
      if (Date.now() < snoozedUntil) {
        setRec(null);
        setVisible(false);
        return;
      }
      stored.userDecision = null;
      delete stored.snoozedUntil;
      saveRecommendation(stored);
    }
    setRec(stored);
    setVisible(true);
  }, []);

  const handleApply = useCallback(() => {
    if (!rec) return;
    const updated = { ...rec, userDecision: "applied", appliedAt: Date.now() };
    saveRecommendation(updated);
    setRec(updated);
    setVisible(false);
    window.dispatchEvent(new CustomEvent("model-change-applied", { detail: rec }));
  }, [rec]);

  const handleDismiss = useCallback(() => {
    if (!rec) return;
    const updated = { ...rec, userDecision: "dismissed", appliedAt: Date.now() };
    saveRecommendation(updated);
    setRec(updated);
    setVisible(false);
  }, [rec]);

  const handleSnooze = useCallback(() => {
    if (!rec) return;
    const updated = { ...rec, userDecision: "snoozed", snoozedUntil: Date.now() + SNOOZE_DURATION };
    saveRecommendation(updated);
    setRec(updated);
    setVisible(false);
  }, [rec]);

  const modelLabels = {
    linear: "Linear",
    block: "Block",
    pyramidal: "Pyramidal",
    polarized: "Polarized",
  };

  return (
    <AnimatePresence>
      {visible && rec && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative border-b border-[#FF5500]/20 bg-gradient-to-r from-[#1a0a00] via-[#2a1100] to-[#1a0a00] px-4 py-3"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF5500]/20 text-sm">
                🔄
              </span>
              <div>
                <p className="font-dmSans text-sm font-semibold text-white">
                  Periodisation Model Recommendation
                </p>
                <p className="font-dmSans text-xs text-white/60">
                  CycloAI detected that{" "}
                  <span className="text-[#FF5500] font-semibold">{modelLabels[rec.suggestedModel] || rec.suggestedModel}</span>{" "}
                  periodisation may fit your recent training response better than{" "}
                  <span className="text-white/80">{modelLabels[rec.previousModel] || rec.previousModel}.</span>{" "}
                  Recommended change starting next week.
                </p>
                {rec.confidenceScore && (
                  <p className="mt-0.5 font-dmSans text-[10px] text-white/30">
                    Confidence: {(rec.confidenceScore * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleApply}
                className="rounded-lg bg-[#FF5500] px-4 py-1.5 font-dmSans text-xs font-bold text-white transition hover:bg-[#e04a00]"
              >
                Apply Change
              </button>
              <button
                onClick={handleSnooze}
                className="rounded-lg border border-white/10 px-4 py-1.5 font-dmSans text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Remind Later
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 font-dmSans text-xs text-white/40 transition hover:text-white/70"
              >
                Keep Current
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModelChangeBanner;
