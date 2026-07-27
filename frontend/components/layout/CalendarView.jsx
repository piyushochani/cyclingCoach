"use client";

import React, { useMemo, useState } from "react";
import {
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
  subMonths,
} from "date-fns";
import { activityDistanceKm, fmtDist } from "../../lib/component-data";

const CalendarView = ({ activities = [], races = [], weeklyPlan }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dayDataMap = useMemo(() => {
    const map = new Map();

    for (const a of activities) {
      if (!a?.date) continue;
      const key = format(new Date(a.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, { activities: [], races: [], workouts: [] });
      map.get(key).activities.push(a);
    }

    for (const r of races) {
      if (!r?.date) continue;
      const key = format(new Date(r.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, { activities: [], races: [], workouts: [] });
      map.get(key).races.push(r);
    }

    if (weeklyPlan?.workouts && weeklyPlan?.startDate) {
      const monday = startOfWeek(new Date(weeklyPlan.startDate), { weekStartsOn: 1 });
      for (const w of weeklyPlan.workouts) {
        const day = new Date(monday);
        day.setDate(day.getDate() + ((w.dayOfWeek + 6) % 7));
        const key = format(day, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, { activities: [], races: [], workouts: [] });
        map.get(key).workouts.push(w);
      }
    }

    return map;
  }, [activities, races, weeklyPlan]);

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#050505] p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-transparent px-3 py-2 font-dmSans text-sm font-medium text-white/72 transition-all duration-150 hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.06] hover:text-[#FF5500]"
        >
          <span className="text-base leading-none">‹</span>
          Prev
        </button>

        <h2 className="font-dmSans text-[1.9rem] font-semibold tracking-[-0.03em] text-white md:text-[2.2rem]">
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <button
          type="button"
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-transparent px-3 py-2 font-dmSans text-sm font-medium text-white/72 transition-all duration-150 hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.06] hover:text-[#FF5500]"
        >
          Next
          <span className="text-base leading-none">›</span>
        </button>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-2 md:gap-3">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center font-dmSans text-[11px] font-bold tracking-[0.12em] text-white/42 md:text-xs">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {calendarDays.map((day) => {
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const key = format(day, 'yyyy-MM-dd');
          const data = dayDataMap.get(key);
          const activityCount = data?.activities?.length || 0;
          const hasRace = (data?.races?.length || 0) > 0;
          const hasWorkout = (data?.workouts?.length || 0) > 0;
          const totalKm = data?.activities?.reduce((s, a) => s + activityDistanceKm(a), 0) || 0;

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={[
                "group relative flex aspect-square min-h-[82px] flex-col items-start justify-between rounded-[16px] border p-3 text-left transition-all duration-150 md:min-h-[92px]",
                today
                  ? "border-[#FF5500]/45 bg-[#FF5500]/[0.10] text-white shadow-[inset_0_0_0_1px_rgba(255,85,0,0.10)]"
                  : inCurrentMonth
                  ? "border-white/12 bg-black text-white hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.05]"
                  : "border-white/8 bg-white/[0.02] text-white/25 hover:border-white/12 hover:bg-white/[0.03]",
              ].join(" ")}
            >
              <span className={[
                "font-dmSans text-sm transition-colors md:text-base",
                today ? "font-semibold text-white" : inCurrentMonth ? "text-white/88 group-hover:text-white" : "text-white/30",
              ].join(" ")}>
                {format(day, "d")}
              </span>

              <div className="flex flex-col gap-0.5 w-full">
                {hasRace && (
                  <span className="font-dmSans text-[9px] uppercase tracking-wide text-[#FF5500] truncate">
                    {data.races[0].name}
                  </span>
                )}
                {activityCount > 0 && (
                  <span className="font-jetbrainsMono text-[9px] text-white/50">
                    {fmtDist(totalKm)} km
                  </span>
                )}
                {hasWorkout && !activityCount && (
                  <span className="font-dmSans text-[9px] text-white/40 capitalize">
                    {data.workouts[0].type}
                  </span>
                )}
              </div>

              {today && (
                <span className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-[#FF5500] shadow-[0_0_10px_rgba(255,85,0,0.65)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
