"use client";

import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

const formatDayDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = getOrdinal(date.getDate());

  return `${weekday} - ${day} ${month}`;
};

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getDayNumber = (dateString, fallbackIndex) => {
  const date = new Date(dateString);
  if (!Number.isNaN(date.getTime())) return date.getDate();
  return fallbackIndex + 1;
};

const HeatmapContainer = ({ data, days }) => {
  const heatmapData = data;
  const heatmapDays = days || defaultDays;

  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const heatmapTitle = heatmapData
    ? `${monthNames[now.getMonth()]} – ${monthNames[(now.getMonth() + 1) % 12]}`
    : "Activity Heatmap";

  const latestActivity = useMemo(() => {
    if (!heatmapData) return null;
    const flat = heatmapData.flat().filter((cell) => cell.level > 0);
    return flat[flat.length - 1] || heatmapData.flat()[0] || null;
  }, [heatmapData]);

  const [selectedDay, setSelectedDay] = useState(latestActivity);

  useEffect(() => {
    if (latestActivity && !selectedDay) setSelectedDay(latestActivity);
  }, [latestActivity, selectedDay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.14 }}
      className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6 md:p-7"
    >
      <div className="mb-6">
        <p className="font-dmSans text-[10px] uppercase tracking-[0.16em] text-white/35">
          Activity Heatmap
        </p>
        <h2 className="mt-1 font-dmSans text-3xl font-semibold tracking-[-0.02em] text-white">
          {heatmapTitle}
        </h2>
      </div>

      {!heatmapData ? (
        <div className="flex items-center justify-center py-12 font-dmSans text-sm text-white/30">
          No activity data yet
        </div>
      ) : (
        <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex h-full flex-col justify-center">
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
                    const isSelected =
                      selectedDay &&
                      selectedDay.details &&
                      selectedDay.details.day === cell.details.day;

                    const dayNumber = getDayNumber(
                      cell.details?.date || cell.details?.day,
                      rowIndex * 7 + colIndex
                    );

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        onClick={() => setSelectedDay(cell)}
                        title={cell.details?.day || cell.details?.date}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          isSelected
                            ? "scale-105 border-white/70"
                            : "border-transparent hover:border-white/30"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-dmSans text-[11px] font-medium ${dotClasses[cell.level]}`}
                        >
                          {dayNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {selectedDay && selectedDay.details && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDay.details.day}
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
                      {formatDisplayDate(selectedDay.details.date || selectedDay.details.day)}
                    </h3>
                    <p className="mt-1 font-dmSans text-sm text-white/45">
                      {formatDayDate(selectedDay.details.date || selectedDay.details.day)}
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
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default HeatmapContainer;