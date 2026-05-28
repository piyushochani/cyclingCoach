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

function openChat(command) {
  window.dispatchEvent(new CustomEvent("openai-chat", { detail: { command } }));
}

const monthActivities = [
  {
    id: 1,
    date: "2026-05-04",
    title: "Endurance Ride",
    type: "Ride",
    distance: 82.4,
    duration: "2h 41m",
    elevation: 640,
  },
  {
    id: 2,
    date: "2026-05-08",
    title: "VO2 Session",
    type: "Ride",
    distance: 41.2,
    duration: "1h 19m",
    elevation: 302,
  },
  {
    id: 3,
    date: "2026-05-12",
    title: "Recovery Spin",
    type: "Ride",
    distance: 24.8,
    duration: "52m",
    elevation: 110,
  },
  {
    id: 4,
    date: "2026-05-17",
    title: "Hill Repeats",
    type: "Ride",
    distance: 58.1,
    duration: "1h 58m",
    elevation: 920,
  },
  {
    id: 5,
    date: "2026-05-17",
    title: "Evening Walk",
    type: "Walk",
    distance: 4.1,
    duration: "39m",
    elevation: 18,
  },
  {
    id: 6,
    date: "2026-05-21",
    title: "Tempo Ride",
    type: "Ride",
    distance: 63.7,
    duration: "2h 03m",
    elevation: 510,
  },
  {
    id: 7,
    date: "2026-05-22",
    title: "Openers",
    type: "Ride",
    distance: 28.3,
    duration: "54m",
    elevation: 145,
  },
];

const todayPlanData = {
  "2026-05-21": {
    title: "Tempo Ride",
    focus: "Controlled aerobic pressure",
    target: "2 x 20 min tempo",
    duration: "2h 00m",
    distance: "60–68 km",
    elevation: "400–600 m",
    notes: "Hold smooth cadence, stay below threshold, no sprint finish.",
    route: "Rolling",
    approxDistance: "60–68 km",
    rideType: "Tempo",
    zones: "Z2, Z3, Z4",
    breakup: [
      { zone: "Z2 Warmup", time: 25 },
      { zone: "Z3 Tempo Block 1", time: 20 },
      { zone: "Z2 Easy Spin", time: 10 },
      { zone: "Z3 Tempo Block 2", time: 20 },
      { zone: "Z1 Cooldown", time: 15 },
    ],
    importance: 4,
    importanceLabel: "Important",
  },
  "2026-05-22": {
    title: "Openers",
    focus: "Pre-race activation",
    target: "45–60 min with 3 short bursts",
    duration: "55m",
    distance: "25–30 km",
    elevation: "Low",
    notes: "Keep it light, sharp, and fresh. Finish wanting more.",
    route: "Flat Route",
    approxDistance: "25–30 km",
    rideType: "Openers",
    zones: "Z1, Z2, Z4",
    breakup: [
      { zone: "Z2 Warmup", time: 30 },
      { zone: "Z4 Threshold", time: 8 },
      { zone: "Z2 Recovery", time: 10 },
      { zone: "Z5 Bursts", time: 4 },
      { zone: "Z1 Cooldown", time: 8 },
    ],
    importance: 5,
    importanceLabel: "Highly Important",
  },
  "2026-05-23": {
    title: "Long Endurance",
    focus: "Durability",
    target: "Zone 2 aerobic base",
    duration: "3h 45m",
    distance: "95–115 km",
    elevation: "700–1000 m",
    notes: "Fuel early, keep effort steady, avoid long threshold efforts.",
    route: "Rolling",
    approxDistance: "95–115 km",
    rideType: "Endurance",
    zones: "Z2",
    breakup: [
      { zone: "Z2 Steady", time: 180 },
      { zone: "Z1 Easy", time: 20 },
      { zone: "Z2 Finish", time: 25 },
    ],
    importance: 4,
    importanceLabel: "Important",
  },
};

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

const weatherPreview = {
  temp: "27°C",
  condition: "Humid",
  wind: "14 km/h",
};

const TrainingCalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date("2026-05-01"));
  const [selectedDay, setSelectedDay] = useState(new Date("2026-05-22"));
  const [focusedDay, setFocusedDay] = useState(new Date("2026-05-22"));
  const [isBreakupOpen, setIsBreakupOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isBreakupOpen ? "hidden" : "";
  }, [isBreakupOpen]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const activitiesThisMonth = useMemo(() => {
    return monthActivities.filter((a) =>
      isSameMonth(new Date(a.date), currentMonth)
    );
  }, [currentMonth]);

  const selectedDayActivities = useMemo(() => {
    return monthActivities.filter((a) =>
      isSameDay(new Date(a.date), selectedDay)
    );
  }, [selectedDay]);

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
      avgDailyTime: Math.round(totalMinutes / daysInMonth),
      avgDailyDistance: (totalDistance / daysInMonth).toFixed(1),
    };
  }, [activitiesThisMonth]);

  const currentFocusedKey = format(focusedDay, "yyyy-MM-dd");
  const todayDetail = todayPlanData[currentFocusedKey] || {
    title: "Recovery / Unstructured",
    focus: "Freshness",
    target: "Easy movement or full rest",
    duration: "45m",
    distance: "Optional",
    elevation: "Low",
    notes: "Stay loose and prioritize recovery.",
    route: "Flat Route",
    approxDistance: "Optional",
    rideType: "Recovery",
    zones: "Z1",
    breakup: [
      { zone: "Z1 Recovery", time: 45 },
    ],
    importance: 2,
    importanceLabel: "Low Importance",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen bg-[#080808] px-4 py-8 text-white md:px-8"
    >
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-8">
          <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#FF5500" }}>
            Training Intelligence
          </p>
          <h1 style={{
            fontFamily: "'Bebas Neue', 'Impact', sans-serif",
            fontSize: "clamp(3rem, 7vw, 5rem)",
            fontWeight: 400, letterSpacing: "0.04em", lineHeight: 0.95,
            margin: "0 0 14px", color: "#fff",
          }}>
            TRAINING <span style={{ color: "#FF5500" }}>CALENDAR</span>
          </h1>
          <div style={{ width: 36, height: 2, background: "#FF5500", marginBottom: 14, borderRadius: 2 }} />
        </div>

        <section className="mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-[#050505]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
            <div>
              <p className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                Analysis Layer
              </p>
              <h2 className="mt-1 font-bebasNeue text-[2rem] tracking-[0.04em] text-white">
                MONTHLY <span className="text-[#FF5500]">ANALYSIS</span>
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
                    const count = monthActivities.filter((a) => isSameDay(new Date(a.date), day)).length;
                    const isSelected = isSameDay(day, selectedDay);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDay(day)}
                        className={[
                          "group flex aspect-square min-h-[84px] flex-col items-center rounded-[16px] border p-3 transition-all duration-150 md:min-h-[92px]",
                          isSelected
                            ? "border-[#FF5500]/45 bg-[#FF5500]/[0.10]"
                            : today
                            ? "border-[#FF5500]/40 bg-[#FF5500]/[0.06]"
                            : inCurrentMonth
                            ? "border-white/12 bg-black hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.05]"
                            : "border-white/8 bg-white/[0.02] text-white/25",
                        ].join(" ")}
                      >
                        <span className={`font-dmSans text-sm md:text-base ${
                          today ? "text-[#FF5500]" :
                          inCurrentMonth ? "text-white/88" : "text-white/30"
                        }`}>
                          {format(day, "d")}
                        </span>

                        <div className="flex flex-1 items-center justify-center">
                          {count > 0 ? (
                            <div className="flex flex-wrap justify-center gap-0.5">
                              {monthActivities
                                .filter((a) => isSameDay(new Date(a.date), day))
                                .map((a) => (
                                  <span key={a.id} className="text-[20px] leading-none" title={a.type}>
                                    {a.type === "Ride" ? "🚴" : a.type === "Run" ? "🏃" : a.type === "Walk" ? "🚶" : "🏋️"}
                                  </span>
                                ))}
                            </div>
                          ) : null}
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
    { label: "Elevation", value: `${monthlyStats.totalElevation.toLocaleString()} m` },
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
                  {selectedDayActivities.length > 0 ? (
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
                <div className="rounded-[14px] border border-white/10 bg-[#080808] px-3 py-2 text-right">
                  <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">
                    Weather
                  </p>
                  <p className="font-dmSans text-xs text-white">
                    {weatherPreview.temp} · {weatherPreview.condition}
                  </p>
                  <p className="mt-0.5 font-dmSans text-[10px] text-white/35">
                    Wind {weatherPreview.wind}
                  </p>
                </div>

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
                  { label: "Ride", value: todayDetail.rideType },
                  { label: "Approx Distance", value: todayDetail.approxDistance },
                  { label: "Target", value: todayDetail.target },
                  { label: "duration", value: todayDetail.duration },
                  { label: "Focus", value: todayDetail.focus },
                  { label: "Route", value: todayDetail.route },
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
                        {todayDetail.breakup.map((b) => `${b.time} mins ${b.zone}`).join(" + ")}
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
                  Remember
                </p>
                <p className="mt-2 font-dmSans text-sm text-white">
                  {todayDetail.duration}
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
      </div>
    </motion.div>
  );
};

export default TrainingCalendarPage;