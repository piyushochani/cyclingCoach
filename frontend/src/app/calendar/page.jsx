"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import WeeklyScheduleCard from "../../../components/layout/WeekScheduleCard";
import { getTrainingWeek } from "../../../components/ui/PaceBotChat";
import { api } from "../../../lib/api";
import { useDataRefetch } from "../../../lib/useDataRefetch";

const WORKOUT_LABELS = {
  rest: 'Rest', recovery: 'Recovery', endurance: 'Endurance',
  tempo: 'Tempo', threshold: 'Threshold', intervals: 'Intervals',
  vo2max: 'VO2 Max', race: 'Race Simulation', long: 'Long Ride',
  gym: 'Gym / Strength', mobility: 'Mobility', stretching: 'Stretching',
};

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function mapActivity(a) {
  return {
    id: a._id,
    date: a.date ? a.date.slice(0, 10) : '',
    title: a.name,
    type: a.sport_type || a.type || 'Ride',
    distance: a.distance ? (a.distance / 1000) : 0,
    duration: formatDuration(a.durationSeconds),
    elevation: a.elevationGain || 0,
  };
}

function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function classifyDays(activities, weeklyPlan, races) {
  const map = {};
  const planMondays = [];
  if (weeklyPlan?.startDate) {
    planMondays.push(getMonday(new Date(weeklyPlan.startDate)));
  }

  const activityDates = {};
  for (const a of activities) {
    if (a.date) activityDates[a.date] = a;
  }

  const raceDates = {};
  for (const r of races || []) {
    if (r.date) {
      const rd = new Date(r.date).toISOString().slice(0, 10);
      raceDates[rd] = r;
    }
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  for (const monday of planMondays) {
    for (const w of weeklyPlan?.workouts || []) {
      const date = new Date(monday);
      date.setDate(date.getDate() + w.dayOfWeek);
      const dateStr = date.toISOString().slice(0, 10);
      const activity = activityDates[dateStr];
      const race = raceDates[dateStr];
      const isFuture = dateStr > todayStr;
      const isPast = dateStr < todayStr;

      if (race) {
        map[dateStr] = { type: 'race', data: race };
      } else if (activity && w.completed) {
        map[dateStr] = { type: 'completed', data: activity, workout: w };
      } else if (activity && !w.completed && !isFuture) {
        map[dateStr] = { type: 'completed', data: activity, workout: w };
      } else if (activity && !w.completed) {
        map[dateStr] = { type: 'completed', data: activity, workout: w };
      } else if (!activity && !w.completed && isPast) {
        map[dateStr] = { type: 'missed', data: w };
      } else if (!activity && !isPast) {
        map[dateStr] = { type: 'future_scheduled', data: w };
      }
    }
  }

  for (const dateStr of Object.keys(activityDates)) {
    if (!map[dateStr]) {
      map[dateStr] = { type: 'bonus', data: activityDates[dateStr] };
    }
  }

  for (const [dateStr, race] of Object.entries(raceDates)) {
    map[dateStr] = { type: 'race', data: race };
  }

  return map;
}

const WORKOUT_EMOJI = { Ride: '🚴', Run: '🏃', Walk: '🚶', Swim: '🏊', Workout: '🏋️', VirtualRide: '🚴' };

function defaultDayDetail() {
  return {
    title: 'Recovery / Unstructured',
    focus: 'Freshness',
    target: 'Easy movement or full rest',
    duration: '45m',
    distance: 'Optional',
    elevation: 'Low',
    notes: 'Stay loose and prioritize recovery.',
    route: 'Flat Route',
    approxDistance: 'Optional',
    rideType: 'Recovery',
    zones: 'Z1',
    breakup: [{ zone: 'Z1 Recovery', time: 45 }],
    importance: 2,
    importanceLabel: 'Low Importance',
  };
}

function openChat(command) {
  window.dispatchEvent(new CustomEvent("openai-chat", { detail: { command } }));
}

const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function toMinutes(duration) {
  const h = duration.match(/(\d+)h/);
  const m = duration.match(/(\d+)m/);
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
}

const formatMinutesAsDuration = (mins) => {
  if (!mins && mins !== 0) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const TrainingCalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [focusedDay, setFocusedDay] = useState(new Date());
  const [isBreakupOpen, setIsBreakupOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const refetchKey = useDataRefetch();

  useEffect(() => {
    document.body.style.overflow = isBreakupOpen ? "hidden" : "";
  }, [isBreakupOpen]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/activities').catch(() => []),
      api.get('/training-context/weekly-plan').catch(() => null),
      api.get('/races').catch(() => []),
    ]).then(([acts, plan, r]) => {
      setActivities(Array.isArray(acts) ? acts.map(mapActivity) : []);
      setWeeklyPlan(plan);
      setRaces(Array.isArray(r) ? r : []);
      setLoading(false);
    });
  }, [refetchKey]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const activitiesThisMonth = useMemo(() => {
    return activities.filter((a) =>
      a.date && isSameMonth(new Date(a.date), currentMonth)
    );
  }, [activities, currentMonth]);

  const dayMeta = useMemo(() => {
    return classifyDays(activities, weeklyPlan, races);
  }, [activities, weeklyPlan, races]);

  const selectedDayMeta = useMemo(() => {
    const dateStr = selectedDay.toISOString().slice(0, 10);
    const meta = dayMeta[dateStr];
    const dayActs = activities.filter((a) => a.date && isSameDay(new Date(a.date), selectedDay));
    return { meta, activities: dayActs, dateStr };
  }, [selectedDay, dayMeta, activities]);

  const selectedDayActivities = useMemo(() => {
    return activities.filter((a) =>
      a.date && isSameDay(new Date(a.date), selectedDay)
    );
  }, [activities, selectedDay]);

  const monthlyStats = useMemo(() => {
    const totalActivities = activitiesThisMonth.length;

    const totalDistance = activitiesThisMonth.reduce((s, a) => s + a.distance, 0);
    const totalElevation = activitiesThisMonth.reduce((s, a) => s + a.elevation, 0);
    const totalMinutes = activitiesThisMonth.reduce((s, a) => s + toMinutes(a.duration), 0);
    const daysInMonth = new Set(activitiesThisMonth.map((a) => a.date)).size || 1;

    return {
      totalActivities,
      totalDistance,
      totalElevation,
      totalMinutes,
      avgDailyTime: parseFloat((totalMinutes / daysInMonth).toFixed(2)),
      avgDailyDistance: (totalDistance / daysInMonth).toFixed(2),
    };
  }, [activitiesThisMonth]);

  const todayDetail = useMemo(() => {
    const dayOfWeek = (focusedDay.getDay() + 6) % 7;
    const planWorkout = weeklyPlan?.workouts?.find(w => w.dayOfWeek === dayOfWeek);
    if (planWorkout) {
      const label = WORKOUT_LABELS[planWorkout.type] || planWorkout.type;
      const importanceMap = { low: 2, medium: 3, high: 5 };
      const imp = importanceMap[planWorkout.importance] || 3;
      const impLabel = { low: 'Low Importance', medium: 'Medium Importance', high: 'High Importance' };
      const description = planWorkout.notes || `${label} session`;
      const distStr = planWorkout.distance ? `${planWorkout.distance.toFixed(2)} km` : '—';
      const zoneStr = planWorkout.zoneBreakdown || '—';
      const terrainStr = planWorkout.terrain || '—';

      const breakup = planWorkout.zoneBreakdown
        ? planWorkout.zoneBreakdown.split(',').map((z) => {
            const parts = z.trim().split(/\s+/);
            const zone = parts[0] || 'Z1';
            const time = parseInt(parts[1], 10) || 45;
            return { zone, time };
          })
        : [{ zone: label, time: 60 }];

      return {
        title: description,
        focus: description,
        target: planWorkout.type === 'rest' ? 'Full rest & recovery' : description,
        duration: '—',
        distance: distStr,
        elevation: '—',
        notes: description,
        route: terrainStr,
        approxDistance: distStr,
        rideType: label,
        zones: zoneStr,
        breakup,
        importance: imp,
        importanceLabel: impLabel[planWorkout.importance] || 'Medium Importance',
      };
    }
    const dayActivity = activities.find(a => a.date && isSameDay(new Date(a.date), focusedDay));
    if (dayActivity) {
      return {
        title: dayActivity.title,
        focus: 'Completed ride',
        target: dayActivity.type,
        duration: dayActivity.duration,
        distance: `${dayActivity.distance.toFixed(1)} km`,
        elevation: `${dayActivity.elevation} m`,
        notes: 'Review in activity details for full analysis.',
        route: '—',
        approxDistance: `${dayActivity.distance.toFixed(1)} km`,
        rideType: dayActivity.type,
        zones: '—',
        breakup: [{ zone: dayActivity.type, time: 60 }],
        importance: 3,
        importanceLabel: 'Completed',
      };
    }
    return defaultDayDetail();
  }, [weeklyPlan, activities, focusedDay]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-10 pt-[44px] md:px-6 md:pt-[52px] xl:px-8"
      >
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Training Intelligence
          </p>
          <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
            TRAINING <span className="text-[#FF5500]">CALENDAR</span>
          </h1>
        </div>

        <section className="mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-[#050505]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
            <div>
              <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                Analysis Layer
              </p>
              <h2 className="mt-1 font-bebasNeue text-[2rem] tracking-[0.04em] text-white">
                MONTHLY <span className="text-[#FF5500]">STATS</span>
              </h2>
            </div>

            <button
              onClick={() => openChat('/month')}
              className="flex items-center justify-center rounded-[16px] border border-[#FF5500]/20 bg-[#FF5500] px-4 py-2 font-dmSans text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-all duration-150 hover:bg-[#ff6a1a] active:scale-[0.98]">
              AI Analysis
            </button>
          </div>

          <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_380px]">
            <div className="border-b border-white/10 p-4 md:p-6 lg:border-b-0 lg:border-r lg:border-white/10 lg:p-8">
              <div className="rounded-[24px] border border-white/10 bg-black p-4 md:p-6">
                <div className="mb-6 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                    className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 px-3 py-2 font-dmSans text-sm font-medium text-white/72 transition-all duration-150 hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.06] hover:text-[#FF5500]"
                  >
                    <span className="text-base leading-none">‹</span>
                    Prev
                  </button>

                  <h3 className="font-dmSans text-[1.9rem] font-semibold tracking-[-0.03em] text-white md:text-[2.2rem]">
                    {format(currentMonth, "MMMM yyyy")}
                  </h3>

                  <button
                    onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                    className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 px-3 py-2 font-dmSans text-sm font-medium text-white/72 transition-all duration-150 hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.06] hover:text-[#FF5500]"
                  >
                    Next
                    <span className="text-base leading-none">›</span>
                  </button>
                </div>

                <div className="mb-3 grid grid-cols-7 gap-2 md:gap-3">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center font-dmSans text-[11px] font-bold tracking-[0.12em] text-white/42 md:text-xs"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 md:gap-3">
                  {calendarDays.map((day) => {
                    const inCurrentMonth = isSameMonth(day, currentMonth);
                    const today = isToday(day);
                    const count = activities.filter((a) => a.date && isSameDay(new Date(a.date), day)).length;
                    const isSelected = isSameDay(day, selectedDay);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDay(day)}
                        className={[
                          "group flex aspect-square min-h-[84px] flex-col items-center rounded-[16px] border p-2 transition-all duration-150 md:min-h-[92px] relative",
                          isSelected
                            ? "border-[#FF5500]/45 bg-[#FF5500]/[0.10]"
                            : today
                            ? "border-[#FF5500]/40 bg-[#FF5500]/[0.06]"
                            : inCurrentMonth
                            ? "border-white/12 bg-black hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.05]"
                            : "border-white/8 bg-white/[0.02] text-white/25",
                        ].join(" ")}
                      >
                        <span className={`font-dmSans text-xs md:text-sm leading-tight ${
                          today ? "text-[#FF5500]" :
                          inCurrentMonth ? "text-white/88" : "text-white/30"
                        }`}>
                          {format(day, "d")}
                        </span>

                        <div className="flex flex-1 items-center justify-center mt-0.5">
                          {(() => {
                            const dateStr = day.toISOString().slice(0, 10);
                            const meta = dayMeta[dateStr];
                            if (!meta) return null;

                            if (meta.type === 'race') {
                              return (
                                <span className="inline-flex items-center rounded-[4px] bg-red-500/90 px-1.5 py-0.5 font-dmSans text-[8px] font-bold uppercase tracking-[0.1em] text-white leading-tight md:text-[9px]">
                                  RACE
                                </span>
                              );
                            }

                            if (meta.type === 'completed') {
                              return (
                                <span className="text-emerald-400 text-sm md:text-base leading-none">✓</span>
                              );
                            }

                            if (meta.type === 'bonus') {
                              return (
                                <span className="text-sky-400 text-sm md:text-base leading-none">★</span>
                              );
                            }

                            if (meta.type === 'missed') {
                              return (
                                <span className="text-red-400/70 text-sm md:text-base leading-none">✕</span>
                              );
                            }

                            if (meta.type === 'future_scheduled') {
                              return (
                                <span className="inline-flex items-center rounded-full bg-yellow-400/20 px-1.5 py-0.5 font-dmSans text-[9px] font-bold uppercase tracking-[0.08em] text-yellow-300 leading-tight md:text-[10px]">
                                  ●
                                </span>
                              );
                            }

                            return null;
                          })()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex min-h-full flex-col p-4 md:p-5">
              <div className="rounded-[22px] border border-white/10 bg-black/30 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                      Monthly Snapshot
                    </p>
                    <h3 className="mt-1 font-dmSans text-xl font-semibold text-white">
                      {format(currentMonth, "MMMM yyyy")}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    </div>
                </div>

                  <div className="grid grid-cols-2 gap-3">
  {[
                  { label: "Distance", value: `${monthlyStats.totalDistance.toFixed(1)} km` },
    { label: "Time", value: formatMinutesAsDuration(monthlyStats.totalMinutes) },
  ].map((item) => (
    <div
      key={item.label}
      className="rounded-[16px] border border-white/10 bg-[#080808] p-4 transition-colors duration-150 hover:border-[#FF5500]/20 hover:bg-[#FF5500]/[0.03]"
    >
      <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
        {item.label}
      </p>
      <p className="mt-1 font-bebasNeue text-[1.6rem] leading-none text-white">
        {item.value}
      </p>
    </div>
  ))}
</div>

<div className="mt-3 grid grid-cols-2 gap-3">
  {[
    { label: "Elevation", value: `${monthlyStats.totalElevation.toFixed(1)} m` },
    { label: "Activities", value: monthlyStats.totalActivities },
  ].map((item) => (
    <div
      key={item.label}
      className="rounded-[16px] border border-white/10 bg-[#080808] p-4 transition-colors duration-150 hover:border-[#FF5500]/20 hover:bg-[#FF5500]/[0.03]"
    >
      <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
        {item.label}
      </p>
      <p className="mt-1 font-bebasNeue text-[1.4rem] leading-none text-white">
        {item.value}
      </p>
    </div>
  ))}
</div>

<div className="mt-3 grid grid-cols-2 gap-3">
  {[
    { label: "Avg Daily Time", value: formatMinutesAsDuration(monthlyStats.avgDailyTime) },
    { label: "Avg Daily Distance", value: `${monthlyStats.avgDailyDistance} km` },
  ].map((item) => (
    <div
      key={item.label}
      className="rounded-[16px] border border-white/10 bg-[#080808] p-4 transition-colors duration-150 hover:border-[#FF5500]/20 hover:bg-[#FF5500]/[0.03]"
    >
      <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
        {item.label}
      </p>
      <p className="mt-1 font-dmSans text-base font-semibold text-white">
        {item.value}
      </p>
    </div>
  ))}
</div>

                
              </div>

              <div className="mt-4 flex-1 rounded-[22px] border border-white/10 bg-black/30 p-4">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                      Selected Day
                    </p>
                    <h3 className="mt-1 font-dmSans text-xl font-semibold text-white">
                      {format(selectedDay, "dd MMM yyyy")}
                    </h3>
                  </div>
                  <span className="font-dmSans text-[11px] uppercase tracking-[0.08em] text-white/30">
                    {selectedDayActivities.length} Activities
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedDayMeta.meta?.type === 'race' ? (
                    <div className="space-y-3">
                      <div className="rounded-[16px] border border-red-500/20 bg-[#070707] p-4">
                        <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-red-400">Race Day</p>
                        <h4 className="mt-1 font-dmSans text-[17px] font-semibold text-white">
                          {selectedDayMeta.meta.data.name || 'Race'}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[16px] border border-white/10 bg-[#070707] p-4">
                          <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">Distance</p>
                          <p className="mt-1 font-dmSans text-sm font-semibold text-white">
                            {(selectedDayMeta.meta.data.distance / 1000).toFixed(1)} km
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/10 bg-[#070707] p-4">
                          <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">Elevation</p>
                          <p className="mt-1 font-dmSans text-sm font-semibold text-white">
                            {selectedDayMeta.meta.data.elevationGain || 0} m
                          </p>
                        </div>
                      </div>
                      <div className="rounded-[16px] border border-white/10 bg-[#070707] p-4">
                        <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">Description</p>
                        <p className="mt-2 font-dmSans text-sm leading-relaxed text-white/72">
                          {selectedDayMeta.meta.data.description || selectedDayMeta.meta.data.story || 'No description available.'}
                        </p>
                      </div>
                    </div>
                  ) : selectedDayMeta.meta?.type === 'future_scheduled' || selectedDayMeta.meta?.type === 'missed' ? (
                    <div className="rounded-[16px] border border-white/10 bg-[#070707] p-4">
                      <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-400">
                        {selectedDayMeta.meta.type === 'missed' ? 'Missed Workout' : 'Planned Workout'}
                      </p>
                      <h4 className="mt-1 font-dmSans text-[15px] font-semibold text-white">
                        {selectedDayMeta.meta.data.notes || selectedDayMeta.meta.data.type || 'Workout'}
                      </h4>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div>
                          <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">Type</p>
                          <p className="mt-1 font-dmSans text-sm text-white/80 capitalize">
                            {selectedDayMeta.meta.data.type || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">Zone</p>
                          <p className="mt-1 font-dmSans text-sm text-white/80">
                            {selectedDayMeta.meta.data.zoneBreakdown || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">Distance</p>
                          <p className="mt-1 font-dmSans text-sm text-white/80">
                            {selectedDayMeta.meta.data.distance ? `${selectedDayMeta.meta.data.distance.toFixed(2)} km` : '—'}
                          </p>
                        </div>
                      </div>
                      <button className="mt-4 w-full rounded-xl border border-[#FF5500]/20 bg-[#FF5500]/10 px-4 py-2.5 font-dmSans text-xs font-bold uppercase tracking-[0.08em] text-[#FF5500] transition hover:bg-[#FF5500]/20">
                        View More
                      </button>
                    </div>
                  ) : selectedDayActivities.length > 0 ? (
                    selectedDayActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="rounded-[16px] border border-white/10 bg-[#070707] p-4 transition-colors duration-150 hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-[#FF5500]">
                              {activity.type}
                            </p>
                            <h4 className="mt-1 font-dmSans text-[15px] font-semibold text-white">
                              {activity.title}
                            </h4>
                          </div>
                          <span className="rounded-full border border-white/10 px-2 py-1 font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/45">
                            {activity.type}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div>
                            <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
                              Distance
                            </p>
                            <p className="mt-1 font-dmSans text-sm text-white">
                              {activity.distance} km
                            </p>
                          </div>
                          <div>
                            <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
                              Time
                            </p>
                            <p className="mt-1 font-dmSans text-sm text-white">
                              {activity.duration}
                            </p>
                          </div>
                          <div>
                            <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
                              Elevation
                            </p>
                            <p className="mt-1 font-dmSans text-sm text-white">
                              {activity.elevation} m
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[16px] border border-dashed border-white/10 bg-[#070707] p-5 text-center font-dmSans text-sm text-white/30">
                      No activities logged for this day.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-white/10 bg-[#050505] p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                  Weekly Block
                </p>
                <h2 className="mt-1 font-bebasNeue text-[1.85rem] tracking-[0.04em] text-white">
                  WEEKLY <span className="text-[#FF5500]">SCHEDULE</span>
                </h2>
              </div>

              <button
                onClick={() => openChat(`/optimize_${getTrainingWeek()}`)}
                className="flex items-center justify-center rounded-[16px] border border-[#FF5500]/20 bg-[#FF5500] px-4 py-2 font-dmSans text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-all duration-150 hover:bg-[#ff6a1a] active:scale-[0.98]">
                Optimize
              </button>
            </div>

            <WeeklyScheduleCard />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#050505] p-5 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <button
                onClick={() => setFocusedDay((prev) => subDays(prev, 1))}
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.06] hover:text-[#FF5500]"
              >
                ‹
              </button>

              <div className="flex-1 text-center">
                <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                  Today Focus
                </p>
                <h2 className="mt-1 font-bebasNeue text-[1.9rem] tracking-[0.04em] text-white">
                  DAY <span className="text-[#FF5500]">DETAIL</span>
                </h2>
                <p className="mt-1 font-dmSans text-sm text-white/40">
                  {format(focusedDay, "dd MMM yyyy")}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <button
                  onClick={() => openChat('/day')}
                  className="flex items-center justify-center rounded-[16px] border border-[#FF5500]/20 bg-[#FF5500] px-4 py-2 font-dmSans text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-all duration-150 hover:bg-[#ff6a1a] active:scale-[0.98]">
                  Understand better
                </button>

                <button
                  onClick={() => setFocusedDay((prev) => addDays(prev, 1))}
                  className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.06] hover:text-[#FF5500]"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/40 p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-[#FF5500]">
                    {format(focusedDay, "EEEE")}
                  </p>
                  <h3 className="mt-1 font-dmSans text-2xl font-semibold text-white">
                    {todayDetail.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={i < todayDetail.importance ? "text-[#FF5500]" : "text-white/15"}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/45">
                    {todayDetail.importanceLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {[
                  { label: "Type", value: todayDetail.rideType },
                  { label: "Distance", value: todayDetail.approxDistance },
                  { label: "Target", value: todayDetail.target },
                  { label: "Zones", value: todayDetail.zones },
                  { label: "Focus", value: todayDetail.focus },
                  { label: "Terrain", value: todayDetail.route },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[16px] border border-white/10 bg-[#080808] p-4 transition-colors duration-150 hover:border-[#FF5500]/20 hover:bg-[#FF5500]/[0.03]"
                  >
                    <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
                      {item.label}
                    </p>
                    <p className="mt-2 font-dmSans text-sm leading-6 text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[16px] border border-white/10 bg-[#080808] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
                        Ride Breakup
                      </p>
                      <p className="mt-2 font-dmSans text-sm leading-6 text-white/72">
                        {todayDetail.breakup.map((b) => `${b.time}min ${b.zone}`).join(" + ")}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsBreakupOpen(true)}
                      className="shrink-0 rounded-full border border-[#FF5500]/20 bg-[#FF5500]/10 px-3 py-1.5 font-dmSans text-[10px] font-bold uppercase tracking-[0.08em] text-[#FF5500] transition hover:bg-[#FF5500]/20"
                    >
                      View Graph
                    </button>
                  </div>
                </div>

                <div className="rounded-[16px] border border-white/10 bg-[#080808] p-4">
                  <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
                    On route diet suggestion
                  </p>
                  <p className="mt-2 font-dmSans text-sm leading-6 text-white/72">
                    {todayDetail.notes}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[16px] border border-white/10 bg-[#080808] p-4">
                <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
                  Coach Notes
                </p>
                <p className="mt-2 font-dmSans text-sm text-white/80 leading-relaxed">
                  {weeklyPlan?.coachNotes || todayDetail.notes || 'Follow your planned workout for today.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {isBreakupOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 md:p-6">
    <div className="w-full max-w-[980px] rounded-[28px] border border-white/10 bg-[#050505] p-5 shadow-2xl md:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
            Zone Distribution
          </p>
          <h3 className="mt-1 font-bebasNeue text-[2.2rem] tracking-[0.04em] text-white md:text-[2.8rem]">
            RIDE <span className="text-[#FF5500]">BREAKUP</span>
          </h3>
          <p className="mt-1 font-dmSans text-sm text-white/40">
            Zone profile across the full ride
          </p>
        </div>

        <button
          onClick={() => setIsBreakupOpen(false)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-[#FF5500]/25 hover:text-[#FF5500]"
        >
          ✕
        </button>
      </div>

      {(() => {
        const chartHeight = 470;
        const leftPad = 0; // Y-axis handled separately
        const rightPad = 28;
        const topPad = 28;
        const bottomPad = 86;

        const zones = [1, 2, 3, 4, 5, 6];
        const totalTime = todayDetail.breakup.reduce((sum, z) => sum + z.time, 0);

        const parseZoneNumber = (label) => {
          const match = label.match(/Z(\d+)/i);
          return match ? Number(match[1]) : 1;
        };

        // Make chart wide enough so each minute has breathing room
        const minWidthPerMin = 11;
        const chartWidth = Math.max(720, totalTime * minWidthPerMin + rightPad);
        const innerWidth = chartWidth - leftPad - rightPad;
        const innerHeight = chartHeight - topPad - bottomPad;

        const yAxisWidth = 92;

        const zoneToY = (zone) => {
          const step = innerHeight / (zones.length - 1);
          return topPad + (zone - 1) * step;
        };

        let elapsed = 0;
        const segments = todayDetail.breakup.map((item, index) => {
          const start = elapsed;
          const end = elapsed + item.time;
          elapsed = end;

          const zone = parseZoneNumber(item.zone);
          const x1 = leftPad + (start / totalTime) * innerWidth;
          const x2 = leftPad + (end / totalTime) * innerWidth;
          const y = zoneToY(zone);

          return {
            ...item,
            index,
            zone,
            start,
            end,
            x1,
            x2,
            y,
            midX: (x1 + x2) / 2,
          };
        });

        const stepPath = segments
          .map((seg, index) => {
            if (index === 0) {
              return `M ${seg.x1} ${seg.y} L ${seg.x2} ${seg.y}`;
            }
            const prev = segments[index - 1];
            return `L ${seg.x1} ${prev.y} L ${seg.x1} ${seg.y} L ${seg.x2} ${seg.y}`;
          })
          .join(" ");

        const axisY = chartHeight - bottomPad + 10;

        return (
          <div className="rounded-[22px] border border-white/10 bg-[#080808] overflow-hidden">
            {/* Main layout: fixed y-axis | scrollable chart | sidebar */}
            <div className="flex">

              {/* Fixed Y-axis column */}
              <div className="flex-shrink-0 border-r border-white/[0.08] bg-[#080808] z-10" style={{ width: yAxisWidth }}>
                <svg
                  viewBox={`0 0 ${yAxisWidth} ${chartHeight}`}
                  width={yAxisWidth}
                  height={chartHeight}
                  style={{ display: "block" }}
                >
                  {zones.map((zone) => {
                    const y = zoneToY(zone);
                    return (
                      <text
                        key={zone}
                        x={yAxisWidth - 10}
                        y={y + 5}
                        textAnchor="end"
                        fill="rgba(255,255,255,0.78)"
                        fontSize="13"
                        fontFamily="DM Sans, sans-serif"
                        fontWeight="500"
                      >
                        Zone {zone}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Horizontally scrollable chart */}
              <div
                className="flex-1 overflow-x-auto overflow-y-hidden"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255,85,0,0.45) rgba(255,255,255,0.05)",
                }}
              >
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  width={chartWidth}
                  height={chartHeight}
                  style={{ display: "block" }}
                  role="img"
                  aria-label="Stepped ride breakup chart"
                >
                  <defs>
                    <linearGradient id="rideLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF7A1A" />
                      <stop offset="100%" stopColor="#FF5500" />
                    </linearGradient>
                    <filter id="orangeGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Horizontal grid lines */}
                  {zones.map((zone) => {
                    const y = zoneToY(zone);
                    return (
                      <line
                        key={zone}
                        x1={0}
                        x2={chartWidth - rightPad}
                        y1={y}
                        y2={y}
                        stroke="rgba(255,255,255,0.07)"
                        strokeDasharray="5 7"
                      />
                    );
                  })}

                  {/* X axis baseline */}
                  <line
                    x1={0}
                    x2={chartWidth - rightPad}
                    y1={axisY}
                    y2={axisY}
                    stroke="rgba(255,255,255,0.16)"
                    strokeWidth="1.5"
                  />

                  {/* Segment separators — extended below axis to clearly separate time labels */}
                  {segments.map((seg, index) => {
                    if (index === segments.length - 1) return null;
                    return (
                      <line
                        key={`separator-${index}`}
                        x1={seg.x2}
                        x2={seg.x2}
                        y1={topPad - 4}
                        y2={axisY + 44} // Extended well below axis
                        stroke="rgba(255,255,255,0.18)"
                        strokeDasharray="4 7"
                      />
                    );
                  })}

                  {/* Per-segment time labels */}
                  {segments.map((seg, index) => (
                    <text
                      key={`time-label-${index}`}
                      x={seg.midX}
                      y={axisY + 26}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.92)"
                      fontSize="13"
                      fontFamily="DM Sans, sans-serif"
                      fontWeight="600"
                    >
                      {seg.time} min
                    </text>
                  ))}

                  {/* X-axis ticks + total time markers */}
                  {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
                    const x = (innerWidth) * tick;
                    const mins = Math.round(totalTime * tick);
                    return (
                      <g key={`tick-${i}`}>
                        <line
                          x1={x}
                          x2={x}
                          y1={axisY}
                          y2={axisY + 8}
                          stroke="rgba(255,255,255,0.2)"
                        />
                        <text
                          x={x}
                          y={axisY + 58}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.35)"
                          fontSize="12"
                          fontFamily="DM Sans, sans-serif"
                        >
                          {mins}m
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis label */}
                  <text
                    x={(chartWidth - rightPad) / 2}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="13"
                    fontFamily="DM Sans, sans-serif"
                  >
                    Time in session
                  </text>

                  {/* Glow behind line */}
                  <path
                    d={stepPath}
                    fill="none"
                    stroke="rgba(255,85,0,0.22)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#orangeGlow)"
                  />

                  {/* Main stepped line */}
                  <path
                    d={stepPath}
                    fill="none"
                    stroke="url(#rideLineGlow)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dots + zone labels above each segment */}
                  {segments.map((seg, index) => (
                    <g key={`point-${index}`}>
                      <circle
                        cx={seg.x1}
                        cy={seg.y}
                        r="5"
                        fill="#080808"
                        stroke="#FF5500"
                        strokeWidth="2.5"
                      />
                      <circle cx={seg.x2} cy={seg.y} r="5" fill="#FF5500" />
                      <text
                        x={seg.midX}
                        y={seg.y - 13}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="13"
                        fontFamily="DM Sans, sans-serif"
                        fontWeight="700"
                      >
                        Z{seg.zone}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Sidebar listings with vertical scroll */}
              <div className="flex-shrink-0 border-l border-white/[0.08] bg-[#0a0a0a] flex flex-col" style={{ width: 200 }}>
                {/* Sticky header row */}
                <div className="grid gap-2 px-3 py-2.5 border-b border-white/[0.08] sticky top-0 bg-[#0a0a0a] z-10" style={{ gridTemplateColumns: "24px 1fr 44px" }}>
                  <span className="font-dmSans text-[9px] font-bold uppercase tracking-[0.1em] text-white/25">#</span>
                  <span className="font-dmSans text-[9px] font-bold uppercase tracking-[0.1em] text-white/25">Zone</span>
                  <span className="font-dmSans text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 text-right">Time</span>
                </div>

                {/* Scrollable rows */}
                <div
                  className="overflow-y-auto flex-1"
                  style={{
                    maxHeight: chartHeight - 40,
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,85,0,0.35) rgba(255,255,255,0.04)",
                  }}
                >
                  {segments.map((seg, index) => (
                    <div
                      key={`row-${index}`}
                      className="grid gap-2 px-3 py-2 border-b border-white/[0.05] items-center transition-colors hover:bg-[#FF5500]/[0.05]"
                      style={{ gridTemplateColumns: "24px 1fr 44px" }}
                    >
                      <span className="font-dmSans text-[11px] font-semibold text-white/25 bg-white/[0.04] rounded text-center py-0.5">
                        {index + 1}
                      </span>
                      <span className="font-dmSans text-[12px] font-bold text-white tracking-[0.03em]">
                        ZONE {seg.zone}
                      </span>
                      <span className="font-dmSans text-[12px] font-semibold text-[#FF5500] text-right">
                        {seg.time}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  </div>
)}
      </motion.main>
    </div>
  );
};

export default TrainingCalendarPage;