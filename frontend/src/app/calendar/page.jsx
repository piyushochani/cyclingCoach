"use client";

import React from "react";
import { motion } from "framer-motion";
import CalendarView from "../../../components/layout/CalendarView";
import WeeklyScheduleCard from "../../../components/layout/WeekScheduleCard";

const TrainingCalendarPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen bg-black px-4 py-8 text-white md:px-8"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-bebasNeue text-4xl tracking-wide text-white md:text-5xl">
            TRAINING CALENDAR
          </h1>
        </div>

        <div className="grid min-h-[760px] grid-cols-1 overflow-hidden rounded-[28px] border border-white/25 bg-black lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="border-b border-white/20 p-4 md:p-6 lg:border-b-0 lg:border-r lg:border-white/20 lg:p-8">
            <div className="mx-auto max-w-[760px]">
              <CalendarView />
            </div>
          </div>

          <div className="border-l border-white/20 bg-black p-5 md:p-6">
            <WeeklyScheduleCard />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrainingCalendarPage;