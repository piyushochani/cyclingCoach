"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const WeeklyGoalCard = ({ activities }) => {
  const [showModal, setShowModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const weeklyGoal = useMemo(() => {
    if (typeof window !== "undefined") {
      return parseFloat(localStorage.getItem("cycloai_weekly_goal") || "100");
    }
    return 100;
  }, []);

  const currentWeekDistance = useMemo(() => {
    if (!activities || activities.length === 0) return 0;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return activities
      .filter((a) => a.date && new Date(a.date) >= weekStart)
      .reduce((s, a) => s + ((a.distance || 0) / 1000), 0);
  }, [activities]);

  const percentage = Math.min(100, (currentWeekDistance / weeklyGoal) * 100);
  const remaining = Math.max(0, weeklyGoal - currentWeekDistance);

  const data = [
    { name: "Achieved", value: percentage },
    { name: "Remaining", value: 100 - percentage },
  ];

  const COLORS = ["#FF6B00", "rgba(255,255,255,0.06)"];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-6 md:p-7"
      >
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-[#FF6B00]/10" />
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#FF6B00]/10" />

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 h-[110px] w-[110px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={52}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {percentage.toFixed(2)}%
              </span>
            </div>
          </div>

          <h2 className="font-dmSans text-lg font-semibold text-white">
            Weekly Goal
          </h2>
          <p className="mt-1 font-dmSans text-sm text-white/50">
            {currentWeekDistance.toFixed(2)} km / {weeklyGoal} km
          </p>

          {remaining > 0 ? (
            <p className="mt-3 font-dmSans text-xs text-white/30">
              {remaining.toFixed(2)} km remaining
            </p>
          ) : (
            <p className="mt-3 flex items-center gap-1 font-dmSans text-xs text-[#FF6B00]">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Goal achieved!
            </p>
          )}

          <button
            onClick={() => { setGoalInput(String(weeklyGoal)); setShowModal(true); }}
            className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-dmSans text-xs font-medium text-white/50 transition hover:border-[#FF6B00]/30 hover:text-white"
          >
            Set Goal
          </button>
        </div>
      </motion.div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-surface-cards p-6 shadow-2xl"
          >
            <h3 className="font-dmSans text-sm font-semibold text-white">Set Weekly Goal</h3>
            <p className="font-dmSans mt-1 text-xs text-white/40">Target distance in kilometers for this week.</p>
            <input
              type="number"
              step="0.1"
              min="1"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="mt-4 w-full rounded-xl border border-white/[0.08] bg-black px-4 py-3 font-jetbrainsMono text-sm text-white outline-none transition focus:border-[#FF6B00]/50"
              placeholder="e.g. 150"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 font-dmSans text-sm text-white/50 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(goalInput);
                  if (val > 0) {
                    localStorage.setItem("cycloai_weekly_goal", String(val));
                    window.location.reload();
                  }
                  setShowModal(false);
                }}
                className="flex-1 rounded-xl bg-[#FF6B00] px-4 py-2.5 font-dmSans text-sm font-bold text-black transition hover:bg-[#FF6B00]/90"
              >
                Save Goal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default WeeklyGoalCard;
