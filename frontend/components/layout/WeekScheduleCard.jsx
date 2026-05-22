"use client";

import React from "react";
import { motion } from "framer-motion";

const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const WeeklyScheduleCard = ({ plans }) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const dateStr = `${weekStart.getDate()}/${weekStart.getMonth() + 1} – ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;

  const todayIdx = now.getDay();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5 md:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="font-dmSans text-[10px] uppercase tracking-[0.16em] text-white/35">
            Week Schedule
          </p>
          <h3 className="mt-1 font-dmSans text-2xl font-semibold tracking-[-0.02em] text-white">
            This Week
          </h3>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-dmSans text-[10px] tracking-[0.12em] text-white/45">
          {dateStr}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {dayNames.map((day, index) => {
          const isToday = index === todayIdx;
          const hasPlan = plans && plans.length > 0;
          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className={`flex items-center justify-between rounded-[14px] border px-4 py-3 transition ${
                isToday
                  ? "border-[#FF7A1A]/30 bg-[#FF7A1A]/[0.06]"
                  : "border-white/8 bg-white/[0.015]"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`font-dmSans text-[11px] uppercase tracking-[0.14em] ${
                    isToday ? "text-[#FF7A1A]" : "text-white/35"
                  }`}
                >
                  {day}
                </span>
                <span
                  className={`font-dmSans text-sm ${
                    isToday ? "text-white/85" : "text-white/35"
                  }`}
                >
                  {isToday ? "Today" : hasPlan ? "Plan available" : "—"}
                </span>
              </div>

              <span
                className={`h-2 w-2 rounded-full ${
                  isToday
                    ? "bg-[#FF7A1A] shadow-[0_0_8px_rgba(255,122,26,0.7)]"
                    : "bg-white/10"
                }`}
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WeeklyScheduleCard;