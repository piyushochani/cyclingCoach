"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "../../lib/api";
import { useDataRefetch } from "../../lib/useDataRefetch";
import Loader from "../ui/Loader";

const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const workoutTypeStyles = {
  rest: { bg: "bg-white/[0.015]", dot: "bg-white/10", label: "Rest" },
  recovery: { bg: "bg-white/[0.015]", dot: "bg-blue-400/60", label: "Recovery" },
  endurance: { bg: "bg-emerald-500/5", dot: "bg-emerald-500", label: "Endurance" },
  tempo: { bg: "bg-amber-500/5", dot: "bg-amber-500", label: "Tempo" },
  threshold: { bg: "bg-orange-500/5", dot: "bg-orange-500", label: "Threshold" },
  intervals: { bg: "bg-red-500/5", dot: "bg-red-500", label: "Intervals" },
  vo2max: { bg: "bg-red-500/5", dot: "bg-red-500", label: "VO2 Max" },
  race: { bg: "bg-purple-500/5", dot: "bg-purple-500", label: "Race" },
  long: { bg: "bg-indigo-500/5", dot: "bg-indigo-500", label: "Long Ride" },
};

const speedEstimates = {
  rest: 0, recovery: 20, endurance: 25, tempo: 30, threshold: 32, intervals: 28, vo2max: 28, race: 35, long: 24,
};

function estimateSpeedKmh(type) {
  if (!type) return 25;
  const t = type.toLowerCase();
  if (t.includes("rest") || t.includes("off")) return 0;
  if (t.includes("recovery")) return 20;
  if (t.includes("endurance") || t.includes("base")) return 25;
  if (t.includes("tempo")) return 30;
  if (t.includes("threshold") || t.includes("ftp")) return 32;
  if (t.includes("interval") || t.includes("vo2")) return 28;
  if (t.includes("race") || t.includes("tt")) return 35;
  if (t.includes("long")) return 24;
  return 25;
}

function formatDuration(distanceKm, type) {
  if (!distanceKm || distanceKm <= 0) return null;
  const speed = estimateSpeedKmh(type);
  if (speed <= 0) return null;
  const hours = distanceKm / speed;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0 && m === 0) return null;
  if (h === 0) return `${m}min`;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function extractHighestZone(zoneBreakdown) {
  if (!zoneBreakdown) return null;
  const matches = zoneBreakdown.match(/Z(\d)/g);
  if (!matches) return null;
  const zones = matches.map((z) => parseInt(z[1], 10));
  const highest = Math.max(...zones);
  return `Z${highest}`;
}

function detectWorkoutType(type) {
  if (!type) return workoutTypeStyles.rest;
  const t = type.toLowerCase();
  if (t.includes("rest") || t.includes("off") || t.includes("recovery")) return workoutTypeStyles.recovery;
  if (t.includes("endurance") || t.includes("long") || t.includes("base")) return workoutTypeStyles.endurance;
  if (t.includes("tempo")) return workoutTypeStyles.tempo;
  if (t.includes("threshold") || t.includes("ftp")) return workoutTypeStyles.threshold;
  if (t.includes("interval") || t.includes("vo2") || t.includes("vo2max")) return workoutTypeStyles.vo2max;
  if (t.includes("race") || t.includes("tt") || t.includes("time trial")) return workoutTypeStyles.race;
  if (t.includes("long")) return workoutTypeStyles.long;
  return workoutTypeStyles.tempo;
}

function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function getTrainingStart() {
  try {
    const stored = localStorage.getItem("cyclogenai_user");
    if (stored) {
      const u = JSON.parse(stored);
      if (u.trainingStart) return new Date(u.trainingStart);
    }
  } catch {}
  const now = new Date();
  return getMonday(now);
}

function getRelativeWeek(targetDate) {
  const trainingStart = getTrainingStart();
  const targetMonday = getMonday(targetDate);
  const startMonday = getMonday(trainingStart);
  const diffMs = targetMonday.getTime() - startMonday.getTime();
  return Math.round(diffMs / (7 * 86400000));
}

const WeeklyScheduleCard = ({ plan: initialPlan }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [plan, setPlan] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const refetchKey = useDataRefetch();

  const isCurrentWeek = weekOffset === 0;

  const relativeWeek = useMemo(() => getRelativeWeek(new Date()), []);
  const trainingStart = useMemo(() => getTrainingStart(), []);
  const weekStart = new Date(trainingStart);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekNum = relativeWeek + weekOffset;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weekOfMonth = Math.ceil((weekStart.getDate() + ((weekStart.getDay() + 6) % 7)) / 7);
  const weekLabel = `${monthNames[weekStart.getMonth()]}-W${weekOfMonth}`;

  const now = new Date();
  const todayDisplayIdx = (now.getDay() + 6) % 7;

  useEffect(() => {
    if (isCurrentWeek && initialPlan) {
      setPlan(initialPlan);
      return;
    }
    const rw = relativeWeek + weekOffset;
    setLoading(true);
    api.get(`/training-context/weekly-plan?relativeWeek=${rw}`)
      .then((data) => setPlan(data))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [weekOffset, relativeWeek, refetchKey, isCurrentWeek, initialPlan]);

  useEffect(() => {
    if (initialPlan && weekOffset === 0) {
      setPlan(initialPlan);
    }
  }, [initialPlan, refetchKey]);

  const workoutMap = {};
  if (plan?.workouts) {
    for (const w of plan.workouts) {
      const displayIdx = (w.dayOfWeek + 6) % 7;
      workoutMap[displayIdx] = w;
    }
  }

  const hasPlan = plan && plan.workouts && plan.workouts.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5 md:p-6"
    >
      <div className="mb-5">
        <p className="mb-4 text-center font-dmSans text-[10px] uppercase tracking-[0.16em] text-white/35">
          Weekly Training Plan
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] transition-all hover:border-white/20 hover:bg-white/10 active:scale-95"
            aria-label="Previous week"
          >
            <span className="text-lg text-white/40 transition-colors group-hover:text-white">←</span>
          </button>

          <div className="w-[200px] flex justify-center">
            <h3 className="text-center font-dmSans text-xl font-semibold tracking-[-0.02em] text-white">
              {weekLabel}
            </h3>
          </div>

          <button
            type="button"
            disabled={isCurrentWeek}
            onClick={() => setWeekOffset((o) => o + 1)}
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] transition-all hover:border-white/20 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next week"
          >
            <span className="text-lg text-white/40 transition-colors group-hover:text-white">→</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={24} />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
              {dayNames.map((day, displayIdx) => {
            const isToday = displayIdx === todayDisplayIdx && isCurrentWeek;
            const workout = workoutMap[displayIdx];
            const style = workout ? detectWorkoutType(workout.type) : workoutTypeStyles.rest;
            const duration = workout?.distance ? formatDuration(workout.distance, workout.type) : null;
            const zone = workout?.zoneBreakdown ? extractHighestZone(workout.zoneBreakdown) : null;
            const description = workout?.notes || null;

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: displayIdx * 0.04, duration: 0.3 }}
                className={`flex items-center justify-between rounded-[14px] border px-4 py-3 transition ${
                  isToday
                    ? "border-[#FF7A1A]/30 bg-[#FF7A1A]/[0.06]"
                    : workout
                      ? "border-white/[0.06] bg-white/[0.02]"
                      : "border-white/8 bg-white/[0.015]"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`font-dmSans text-[11px] uppercase tracking-[0.14em] ${
                      isToday ? "text-[#FF7A1A]" : "text-white/35"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="flex flex-col">
                    <span
                      className={`font-dmSans text-sm leading-tight ${
                        isToday
                          ? "text-white/85"
                          : workout
                            ? "text-white/60"
                            : "text-white/35"
                      }`}
                    >
                      {isToday ? "Today" : style.label}
                    </span>
                    {description ? (
                      <span className="font-dmSans text-[11px] text-white/40 mt-0.5 leading-relaxed">
                        {description}
                      </span>
                    ) : workout ? (
                      <span className="font-dmSans text-[11px] text-white/30 mt-0.5">
                        {zone ? `${zone} ` : ""}{duration || ""}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {workout?.completed && (
                    <span className="text-emerald-400 text-xs mr-0.5">✓</span>
                  )}
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isToday
                        ? "bg-[#FF7A1A] shadow-[0_0_8px_rgba(255,122,26,0.7)]"
                        : style.dot
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default WeeklyScheduleCard;
