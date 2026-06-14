"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "../../../lib/api";

const DATE_RANGE_OPTIONS = ["All Time", "Last 30 Days", "Last 7 Days", "This Year"];
const SORT_OPTIONS = [
  { label: "Date", value: "date" },
  { label: "Distance", value: "distance" },
  { label: "Time", value: "time" },
];
const ACTIVITY_OPTIONS = ["All", "Bike", "Run", "Walk"];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const formatDate = (raw) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const formatDistance = (val) => {
  if (val === undefined || val === null || Number.isNaN(parseFloat(val))) return "—";
  return (parseFloat(val) / 1000).toFixed(2);
};

const formatPace = (distance, seconds) => {
  if (!distance || !seconds) return "—";
  const paceMin = (seconds / 60) / distance;
  const m = Math.floor(paceMin);
  const sec = Math.round((paceMin - m) * 60);
  return `${m}:${String(sec).padStart(2, "0")}/km`;
};

const sportMeta = {
  Cycling: { icon: "🚴", label: "RIDE", color: "#FF5500" },
  Bike: { icon: "🚴", label: "RIDE", color: "#FF5500" },
  cycling: { icon: "🚴", label: "RIDE", color: "#FF5500" },
  Running: { icon: "🏃", label: "RUN", color: "#60A5FA" },
  Run: { icon: "🏃", label: "RUN", color: "#60A5FA" },
  running: { icon: "🏃", label: "RUN", color: "#60A5FA" },
  Walking: { icon: "🚶", label: "WALK", color: "#4ADE80" },
  Walk: { icon: "🚶", label: "WALK", color: "#4ADE80" },
  walking: { icon: "🚶", label: "WALK", color: "#4ADE80" },
  workout: { icon: "🏋️", label: "WORKOUT", color: "#A78BFA" },
  Workout: { icon: "🏋️", label: "WORKOUT", color: "#A78BFA" },
  hiking: { icon: "🥾", label: "HIKE", color: "#D4A574" },
  Hiking: { icon: "🥾", label: "HIKE", color: "#D4A574" },
};

const getSportMeta = (sport = "") =>
  sportMeta[sport] || { icon: "🚴", label: (sport || "").toUpperCase(), color: "rgba(255,255,255,0.35)" };

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-dmSans text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 whitespace-nowrap">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="appearance-none rounded-xl border border-white/[0.10] bg-surface-cards px-3.5 py-2.5 pr-9 text-sm font-medium text-white outline-none transition-all duration-200 hover:border-white/20 focus:border-[#FF5500]/50 min-w-[140px]"
        >
          {options.map((o) => {
            const option = typeof o === "string" ? { label: o, value: o } : o;
            return (
              <option key={option.value} value={option.value} className="bg-surface-cards text-white">
                {option.label}
              </option>
            );
          })}
        </select>
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/50">▼</span>
      </div>
    </div>
  );
}

function ActivityRow({ activity, index }) {
  const meta = getSportMeta(activity.sport);
  const [hovered, setHovered] = useState(false);
  const activityId = activity?._id || activity?.id || activity?.stravaId || `act-${index}`;

  return (
    <Link href={`/activities/${activityId}`} className="block no-underline">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="grid cursor-pointer grid-cols-[56px_minmax(0,1.5fr)_100px_105px_85px_100px] gap-3 border-b border-white/[0.03] px-4 py-3.5 transition-all duration-200 md:grid-cols-[72px_minmax(0,1.5fr)_110px_120px_100px_110px]"
        style={{ background: hovered ? "rgba(255,85,0,0.03)" : "transparent" }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-lg leading-none">{meta.icon}</span>
          <span
            className="text-[8px] font-extrabold uppercase tracking-[0.14em] md:text-[9px]"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white leading-tight transition-colors duration-200" style={{ color: hovered ? "#FF5500" : "white" }}>
            {activity.title || activity.name || "Untitled Activity"}
          </p>
          <p className="mt-1 text-[11px] text-white/20">{formatDate(activity.date)}</p>
        </div>

        <span className="font-jetbrainsMono text-sm font-bold text-white/90">
          {formatDistance(activity.distance)} km
        </span>

        <span className="font-jetbrainsMono text-[13px] text-white/70">
          {formatDuration(activity.durationSeconds)}
        </span>

        <span className="font-jetbrainsMono text-[13px] text-white/35">
          {((activity.elevation ?? activity.elevationGain) || 0).toFixed(2)} m
        </span>

        <span className="flex items-center gap-1.5 text-xs text-white/20">
          <span className="hidden md:inline">{formatDate(activity.date)}</span>
          <span className="inline md:hidden text-white/15">
            {formatPace(activity.distance, activity.durationSeconds)}
          </span>
        </span>
      </motion.div>
    </Link>
  );
}

function SkeletonRows() {
  return (
    <div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="my-px animate-pulse"
          style={{
            height: 58,
            background: "rgba(255,255,255,0.03)",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [sortBy, setSortBy] = useState("date");
  const [activityFilter, setActivityFilter] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/activities")
      .then((data) => setActivities(data || []))
      .catch((err) => console.error("Failed to load activities:", err))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => {
    const now = new Date();

    const filtered = activities.filter((a) => {
      const sportNorm = (a.sport || "").toLowerCase();

      if (activityFilter === "Bike" && !["cycling", "bike"].includes(sportNorm)) return false;
      if (activityFilter === "Run" && !["running", "run"].includes(sportNorm)) return false;
      if (activityFilter === "Walk" && !["walking", "walk"].includes(sportNorm)) return false;

      if (dateRange !== "All Time") {
        const d = new Date(a.date);
        if (isNaN(d)) return false;
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        if (dateRange === "Last 7 Days" && diffDays > 7) return false;
        if (dateRange === "Last 30 Days" && diffDays > 30) return false;
        if (dateRange === "This Year" && d.getFullYear() !== now.getFullYear()) return false;
      }

      const title = (a.title || a.name || "").toLowerCase();
      if (searchQuery && !title.includes(searchQuery.toLowerCase())) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "date") return new Date(b.date) - new Date(a.date);
      if (sortBy === "distance") return (parseFloat(b.distance) || 0) - (parseFloat(a.distance) || 0);
      if (sortBy === "time") return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      return 0;
    });
  }, [activities, sortBy, activityFilter, dateRange, searchQuery]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visibleCount;

  const summaryStats = useMemo(() => {
    const total = activities.length;
    const totalDist = activities.reduce((s, a) => s + (parseFloat(a.distance) || 0), 0) / 1000;
    const totalElev = activities.reduce((s, a) => s + (a.elevationGain || 0), 0);
    const totalTime = activities.reduce((s, a) => s + (a.durationSeconds || 0), 0);
    return { total, totalDist, totalElev, totalTime };
  }, [activities]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-10 pt-[44px] md:px-6 md:pt-[52px] xl:px-8"
      >
        <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
              Training Log
            </p>
            <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
              Your <span className="text-[#FF5500]">Activities</span>
            </h1>
            <p className="mt-3 max-w-2xl font-dmSans text-sm text-white/50 md:text-[15px]">
              Every ride, run, and walk — filtered like a performance board.
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-[#111318] px-5 py-4">
            <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Total Activities</p>
            <p className="font-jetbrainsMono mt-1 text-2xl font-bold text-white">{summaryStats.total}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#111318] px-5 py-4">
            <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Total Distance</p>
            <p className="font-jetbrainsMono mt-1 text-2xl font-bold text-white">{summaryStats.totalDist.toFixed(2)} <span className="text-xs text-white/30 ml-1">KM</span></p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#111318] px-5 py-4">
            <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Total Elevation</p>
            <p className="font-jetbrainsMono mt-1 text-2xl font-bold text-white">{summaryStats.totalElev.toFixed(0)} <span className="text-xs text-white/30 ml-1">M</span></p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#111318] px-5 py-4">
            <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Total Time</p>
            <p className="font-jetbrainsMono mt-1 text-2xl font-bold text-white">{formatDuration(summaryStats.totalTime)}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <FilterSelect label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} options={SORT_OPTIONS} />
          <FilterSelect
            label="Activity"
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            options={ACTIVITY_OPTIONS.map((o) => ({ label: o === "All" ? "All Activities" : o, value: o }))}
          />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-[240px] flex-1 rounded-xl border border-white/10 bg-[#111318] px-4 py-3 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-white/20 focus:border-[#FF5500]/50"
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {DATE_RANGE_OPTIONS.map((opt) => {
            const active = dateRange === opt;
            return (
              <button
                key={opt}
                onClick={() => setDateRange(opt)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-[#FF5500] text-white border border-[#FF5500]"
                    : "border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition-all"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <p className="font-dmSans mb-4 text-[11px] uppercase tracking-wider text-white/20">
          Showing {visible.length} of {sorted.length} results
        </p>

        <div className="rounded-2xl border border-white/5 bg-[#111318] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-[56px_minmax(0,1.5fr)_100px_105px_85px_100px] gap-3 border-b border-white/5 px-6 py-4 md:grid-cols-[72px_minmax(0,1.5fr)_110px_120px_100px_110px]">
            {["Type", "Activity", "Distance", "Time", "Elev", "Date"].map((h) => (
              <span
                key={h}
                className="font-dmSans text-[10px] font-bold uppercase tracking-[0.15em] text-white/30"
              >
                {h}
              </span>
            ))}
          </div>

          {loading ? (
            <SkeletonRows />
          ) : visible.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <p className="font-dmSans text-sm text-white/20">No activities found matching your criteria.</p>
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show">
              {visible.map((activity, index) => (
                <ActivityRow key={activity._id || activity.id || index} activity={activity} index={index} />
              ))}
            </motion.div>
          )}
        </div>

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <motion.button
              onClick={() => setVisibleCount((c) => c + 12)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200"
            >
              Load More Activities
            </motion.button>
          </div>
        )}
      </motion.main>
    </div>
  );
}
