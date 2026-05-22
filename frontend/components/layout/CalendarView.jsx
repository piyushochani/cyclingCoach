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
    <div className="rounded-[24px] border border-white/30 bg-black p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          className="flex items-center gap-2 font-dmSans text-sm text-white/90 transition hover:text-accent-orange"
        >
          <span className="text-base">‹</span>
          Prev
        </button>

        <h2 className="font-dmSans text-2xl font-medium text-white md:text-3xl">
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <button
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          className="flex items-center gap-2 font-dmSans text-sm text-white/90 transition hover:text-accent-orange"
        >
          Next
          <span className="text-base">›</span>
        </button>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-2 md:gap-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center font-dmSans text-xs font-medium tracking-wide text-white/85 md:text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {calendarDays.map((day) => {
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`flex aspect-square min-h-[82px] items-start justify-center rounded-[14px] border p-3 md:min-h-[92px] ${
                today
                  ? "border-white bg-white/8 text-white"
                  : inCurrentMonth
                  ? "border-white/35 bg-black text-white"
                  : "border-white/15 bg-black/40 text-white/35"
              }`}
            >
              <span className="font-dmSans text-sm md:text-base">
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;