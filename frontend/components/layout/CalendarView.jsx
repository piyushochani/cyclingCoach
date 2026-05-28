"use client";

import React, { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

const CalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#050505] p-4 md:p-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
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
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-transparent px-3 py-2 font-dmSans text-sm font-medium text-white/72 transition-all duration-150 hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.06] hover:text-[#FF5500]"
        >
          Next
          <span className="text-base leading-none">›</span>
        </button>
      </div>

      {/* Week labels */}
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {calendarDays.map((day) => {
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={[
                "group flex aspect-square min-h-[82px] items-start justify-between rounded-[16px] border p-3 text-left transition-all duration-150 md:min-h-[92px]",
                today
                  ? "border-[#FF5500]/45 bg-[#FF5500]/[0.10] text-white shadow-[inset_0_0_0_1px_rgba(255,85,0,0.10)]"
                  : inCurrentMonth
                  ? "border-white/12 bg-black text-white hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.05]"
                  : "border-white/8 bg-white/[0.02] text-white/25 hover:border-white/12 hover:bg-white/[0.03]",
              ].join(" ")}
            >
              <span
                className={[
                  "font-dmSans text-sm transition-colors md:text-base",
                  today
                    ? "font-semibold text-white"
                    : inCurrentMonth
                    ? "text-white/88 group-hover:text-white"
                    : "text-white/30",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>

              {today && (
                <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[#FF5500] shadow-[0_0_10px_rgba(255,85,0,0.65)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;