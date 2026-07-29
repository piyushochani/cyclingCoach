"use client";

import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { activityDistanceKm, fmtDist, fmtDuration, getActivityId } from "../../lib/component-data";

const defaultDays = ["M", "T", "W", "T", "F", "S", "S"];

const dotClasses = {
  0: "bg-white/10 text-white/35",
  1: "bg-[#FF7A1A]/40 text-white",
  2: "bg-[#FF7A1A]/70 text-white",
  3: "bg-[#FF7A1A] text-white",
};

const getOrdinal = (day) => {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return `${day}st`;
  if (mod10 === 2 && mod100 !== 12) return `${day}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${day}rd`;
  return `${day}th`;
};

const formatDayDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = getOrdinal(date.getDate());
  return `${weekday} - ${day} ${month}`;
};

const formatDisplayDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HeatmapContainer = ({ activities, days }) => {
  const heatmapDays = days || defaultDays;
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const prevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const heatmapData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Monday = 0 ... Sunday = 6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    // Map activities for this month only
    const dayMap = {};
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const date = new Date(year, month, dayNum);
      dayMap[dayNum] = { date, activities: [], totalTime: 0, totalDistance: 0, totalCalories: 0 };
    }

    if (activities) {
      for (const a of activities) {
        const d = new Date(a.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const dayNum = d.getDate();
          if (dayMap[dayNum]) {
            dayMap[dayNum].activities.push(a);
            dayMap[dayNum].totalTime += a.durationSeconds || 0;
            dayMap[dayNum].totalDistance += activityDistanceKm(a);
            dayMap[dayNum].totalCalories += a.calories || 0;
          }
        }
      }
    }

    const cells = [];

    // Leading empty cells
    for (let i = 0; i < startOffset; i++) {
      cells.push({ level: -1, details: { empty: true } });
    }

    // Actual days of the month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const day = dayMap[dayNum];
      const count = day.activities.length;
      const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
      cells.push({
        level,
        details: {
          date: day.date,
          dayNumber: dayNum,
          activities: count,
          activityIds: day.activities.map((a, i) => getActivityId(a) || `act-${i}`),
          time: fmtDuration(day.totalTime),
          distance: `${fmtDist(day.totalDistance)} km`,
          calories: day.totalCalories > 0 ? `${Math.round(day.totalCalories)} kcal` : '—',
        },
      });
    }

    // Trailing empty cells to complete the last row
    while (cells.length % 7 !== 0) {
      cells.push({ level: -1, details: { empty: true } });
    }

    // Chunk into rows of 7
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }

    return rows;
  }, [activities, viewDate]);

  const hasActivityData = useMemo(() => {
    return heatmapData.some((row) =>
      row.some((cell) => !cell.details.empty && cell.level > 0)
    );
  }, [heatmapData]);

  const latestActivityDay = useMemo(() => {
    const flat = heatmapData.flat().filter((cell) => cell.level > 0);
    return flat.length > 0 ? flat[flat.length - 1] : null;
  }, [heatmapData]);

  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (latestActivityDay) {
      setSelectedDay(latestActivityDay);
    } else {
      const firstValid = heatmapData
        .flat()
        .find((cell) => cell.details && !cell.details.empty);
      setSelectedDay(firstValid || null);
    }
  }, [heatmapData, latestActivityDay]);

  const heatmapTitle = `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.14 }}
      className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6 md:p-7"
    >
      <div className="mb-6 flex flex-col items-center">
        <p className="font-dmSans text-[10px] uppercase tracking-[0.16em] text-white/35">
          Activity Heatmap
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            onClick={prevMonth}
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] transition-all hover:border-white/20 hover:bg-white/10 active:scale-95"
            aria-label="Previous month"
          >
            <span className="text-lg text-white/40 transition-colors group-hover:text-white">←</span>
          </button>

          <div className="min-w-0 flex-1 flex justify-center px-2 lg:w-[280px] lg:flex-none">
            <h2 className="text-center font-dmSans text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl lg:text-3xl">
              {heatmapTitle}
            </h2>
          </div>

          <button
            onClick={nextMonth}
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] transition-all hover:border-white/20 hover:bg-white/10 active:scale-95"
            aria-label="Next month"
          >
            <span className="text-lg text-white/40 transition-colors group-hover:text-white">→</span>
          </button>
        </div>
      </div>

      {!activities || activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">📅</div>
          <p className="font-dmSans text-sm text-white/30">No ride data yet</p>
          <p className="font-dmSans text-xs text-white/20 max-w-[260px] text-center">
            Activities will appear here once synced from Strava. Auto-sync runs every 5 minutes, or use &quot;Refresh Strava Data&quot; in your profile menu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex flex-col justify-center">
            <div className="mb-3 grid grid-cols-7 gap-2 text-center">
              {heatmapDays.map((day, index) => (
                <span
                  key={`${day}-${index}`}
                  className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/35"
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              {heatmapData.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-7 gap-2">
                  {row.map((cell, colIndex) => {
                    if (cell.details.empty) {
                      return <div key={`${rowIndex}-${colIndex}`} className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9" />;
                    }

                    const isSelected =
                      selectedDay &&
                      selectedDay.details &&
                      !selectedDay.details.empty &&
                      selectedDay.details.dayNumber === cell.details.dayNumber;

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        onClick={() => setSelectedDay(cell)}
                        title={formatDisplayDate(cell.details.date)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition sm:h-8 sm:w-8 lg:h-9 lg:w-9 ${
                          isSelected
                            ? "scale-105 border-white/70"
                            : "border-transparent hover:border-white/30"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-dmSans text-[11px] font-medium ${dotClasses[cell.level]}`}
                        >
                          {cell.details.dayNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {selectedDay && selectedDay.details && !selectedDay.details.empty && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDay.details.dayNumber}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="rounded-[20px] border border-white/10 bg-black/40 p-5"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-dmSans text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Selected Day
                    </p>
                    <h3 className="mt-1 font-dmSans text-2xl font-medium text-white">
                      {formatDisplayDate(selectedDay.details.date)}
                    </h3>
                    <p className="mt-1 font-dmSans text-sm text-white/45">
                      {formatDayDate(selectedDay.details.date)}
                    </p>
                  </div>

                  {selectedDay.level > 0 ? (
                    <span className="rounded-full border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 px-3 py-1 font-dmSans text-[10px] uppercase tracking-[0.12em] text-[#FF7A1A]">
                      Active
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { label: "Activities", value: selectedDay.details.activities },
                    { label: "Time", value: selectedDay.details.time },
                    { label: "Distance", value: selectedDay.details.distance },
                    { label: "Calories", value: selectedDay.details.calories },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[14px] border border-white/10 bg-white/[0.02] p-4"
                    >
                      <p className="font-dmSans text-[11px] uppercase tracking-[0.12em] text-white/40">
                        {item.label}
                      </p>
                      <p className="mt-2 font-dmSans text-xl font-medium text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedDay.details.activityIds && selectedDay.details.activityIds.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <p className="font-dmSans text-[10px] uppercase tracking-[0.14em] text-white/25">
                      Launch Coaching Analysis
                    </p>
                    {selectedDay.details.activityIds.map((id, idx) => (
                      <a
                        key={id}
                        href={`/activities/${id}`}
                        className="flex items-center justify-between rounded-xl border border-[#FF7A1A]/20 bg-[#FF7A1A]/5 px-4 py-3 transition-all hover:bg-[#FF7A1A]/10 active:scale-[0.98]"
                      >
                        <span className="font-dmSans text-sm font-medium text-white">
                          View Ride {selectedDay.details.activityIds.length > 1 ? idx + 1 : ''}
                        </span>
                        <span className="text-[#FF7A1A]">→</span>
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default HeatmapContainer;