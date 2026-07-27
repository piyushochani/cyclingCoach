"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const rowMotion = {
  rest: { x: 0 },
  hover: { x: 4 },
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDistance(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${(Number(value) / 1000).toFixed(2)} km`;
}

function formatDuration(durationSeconds, fallbackDuration) {
  if (fallbackDuration) return fallbackDuration;
  if (durationSeconds === null || durationSeconds === undefined || Number.isNaN(Number(durationSeconds))) return "—";

  const totalSeconds = Number(durationSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function RecentActivity({ activities = [] }) {
  const recentActivities = useMemo(() => {
    const seen = new Set();
    return [...activities]
      .filter((a) => {
        const key = (a.stravaId != null && a.stravaId !== 0) ? a.stravaId : a.name + a.distance;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
      .slice(0, 20);
  }, [activities]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-[24px] border border-white/10 bg-[#111318] p-5 md:p-6"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-white/35">
            Dashboard Feed
          </p>
          <h2 className="mt-1 font-barlowCondensed text-[30px] font-semibold uppercase tracking-[0.03em] text-white md:text-[34px]">
            Recent Activities
          </h2>
        </div>

      </div>

      <div className="overflow-hidden rounded-[20px] border border-white/8 bg-black/20">
        <div className="grid grid-cols-4 gap-3 border-b border-white/8 bg-white/[0.03] px-4 py-3 md:px-5">
          <div className="font-dmSans text-[11px] uppercase tracking-[0.16em] text-white/40">Date</div>
          <div className="font-dmSans text-[11px] uppercase tracking-[0.16em] text-white/40">Activity Name</div>
          <div className="text-right font-dmSans text-[11px] uppercase tracking-[0.16em] text-white/40">Distance</div>
          <div className="text-right font-dmSans text-[11px] uppercase tracking-[0.16em] text-white/40">Time</div>
        </div>

        {recentActivities.length > 0 ? (
          <div>
            {recentActivities.map((activity, index) => {
              const activityId = activity?._id || activity?.id || activity?.stravaId || `act-${index}`;
              const activityName = activity?.title || activity?.name || "Untitled Activity";

              return (
                <Link key={`${activityId}-${index}`} href={`/activities/${activityId}`} className="block">
                  <motion.div
                    initial="rest"
                    whileHover="hover"
                    animate="rest"
                    variants={rowMotion}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="grid grid-cols-4 gap-3 border-b border-white/6 px-4 py-3 transition-colors duration-200 hover:bg-[#FF5500]/10 md:px-5"
                  >
                    <div className="font-dmSans text-sm text-white/55">
                      {formatDate(activity?.date)}
                    </div>

                    <div className="min-w-0 font-dmSans text-sm font-medium text-white">
                      <span className="block truncate">{activityName}</span>
                    </div>

                    <div className="text-right font-jetBrainsMono text-sm text-white/85">
                      {formatDistance(activity?.distance)}
                    </div>

                    <div className="text-right font-jetBrainsMono text-sm text-white/65">
                      {formatDuration(activity?.durationSeconds, activity?.duration)}
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-10 text-center font-dmSans text-sm text-white/35">
            No recent activities yet.
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-center">
        <Link
          href="/activities"
          className="inline-flex items-center justify-center rounded-full border border-[#FF5500]/30 bg-[#FF5500]/10 px-5 py-2.5 font-dmSans text-sm font-medium text-[#FF5500] transition-all duration-200 hover:bg-[#FF5500]/20 hover:text-white"
        >
          See More
        </Link>
      </div>
    </motion.section>
  );
}

