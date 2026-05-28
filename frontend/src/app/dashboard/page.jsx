"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { api } from "../../../lib/api";
import { useAutoSync } from "../../../lib/useAutoSync";
import ProfileContainer from "../../../components/layout/ProfileContainer";
import WeeklyScheduleCard from "../../../components/layout/WeekScheduleCard";
import StatsYearCard from "../../../components/layout/StatsYearCard";
import HeatmapContainer from "../../../components/layout/HeatmapContainer";
import WeeklyGraph from "../../../components/layout/WeeklyGraph";
import WeatherWidget from "../../../components/layout/WeatherWidget";
import RecentActivity from "../../../components/layout/RecentActivity";

function buildHeatmapData(activities) {
  if (!activities || activities.length === 0) return null;
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 34);
  const dayMap = {};
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toDateString();
    dayMap[key] = { date: new Date(d), activities: [], totalTime: 0, totalDistance: 0 };
  }
  for (const a of activities) {
    const d = new Date(a.date);
    const key = d.toDateString();
    if (dayMap[key]) {
      dayMap[key].activities.push(a);
      dayMap[key].totalTime += a.durationSeconds || 0;
      dayMap[key].totalDistance += a.distance || 0;
    }
  }
  const days = Object.values(dayMap).sort((a, b) => a.date - b.date);
  const rows = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (idx < days.length) {
        const day = days[idx];
        const count = day.activities.length;
        const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
        const hours = (day.totalTime / 3600).toFixed(1);
        const dist = day.totalDistance.toFixed(1);
        row.push({
          level,
          details: {
            day: day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            activities: count,
            time: `${hours} hrs`,
            distance: `${dist} km`,
            calories: `${Math.round(day.totalDistance * 28)} kcal`,
          },
        });
      } else {
        row.push({ level: 0, details: { day: "", activities: 0, time: "0 hrs", distance: "0 km", calories: "0 kcal" } });
      }
    }
    rows.push(row);
  }
  return rows;
}

const DashboardPage = () => {
  const pathname = usePathname();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [races, setRaces] = useState([]);
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const { status: syncStatus, lastSynced } = useAutoSync();

  useEffect(() => {
    const stored = localStorage.getItem("cycloai_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser({ firstName: u.firstName || u.name || "", lastName: u.lastName || "", email: u.email || "", goal: u.goal || "", profileImage: u.profileImage || "", description: u.description || "" });
      } catch {}
    }
    Promise.all([
      api.get('/stats').catch(() => null),
      api.get('/activities').catch(() => []),
      api.get('/races').catch(() => []),
      api.get('/plans').catch(() => []),
    ])
      .then(([statsData, activitiesData, racesData, plansData]) => {
        setStats(statsData);
        setActivities(activitiesData);
        setRaces(racesData);
        setPlans(plansData);
      });
  }, [pathname]);

  const statCards = useMemo(() => stats
    ? [
        { label: "Distance", value: Math.round(stats.totalDistance).toLocaleString(), unit: "KM", accent: "→" },
        { label: "Time", value: Math.round(stats.totalDuration / 3600).toLocaleString(), unit: "HRS", accent: "◷" },
        { label: "Activities", value: stats.activityCount.toString(), unit: "", accent: "◈" },
        { label: "Races Played", value: races.length.toString(), unit: "", accent: "⬡" },
        { label: "Avg / Week", value: stats.activityCount > 4 ? Math.round(stats.totalDistance / (stats.activityCount / 4)).toLocaleString() : "0", unit: "KM", accent: "∿" },
      ]
    : null, [stats, races]);

  const heatmapData = useMemo(() => buildHeatmapData(activities), [activities]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-10 pt-[44px] md:px-6 md:pt-[52px] xl:px-8"
      >
        <div className="mb-8 flex flex-col gap-3 border-b border-white/8 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF4C00]/80">
              Performance Dashboard
            </p>
            <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
              Your Dashboard
            </h1>
            <p className="mt-3 max-w-2xl font-dmSans text-sm text-white/50 md:text-[15px]">
              Track your season, review training consistency, and monitor your
              current performance block.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <WeatherWidget />
            <div className="flex items-center gap-2 self-start rounded-full border border-[#FF4C00]/20 bg-[#FF4C00]/10 px-4 py-2 md:self-auto">
              <span className="h-2 w-2 rounded-full bg-[#FF4C00] shadow-[0_0_10px_rgba(255,76,0,0.7)]" />
              <span className="font-dmSans text-[11px] uppercase tracking-[0.14em] text-[#FF4C00]">
                2026 Season Active
              </span>
            </div>
            {syncStatus !== "idle" && (
              <div className={`flex items-center gap-2 self-start rounded-full border px-3 py-1.5 md:self-auto ${
                syncStatus === "syncing" ? "border-[#FF5500]/30 bg-[#FF5500]/10" :
                syncStatus === "success" ? "border-green-500/30 bg-green-500/10" :
                "border-red-500/30 bg-red-500/10"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  syncStatus === "syncing" ? "bg-[#FF5500] animate-pulse" :
                  syncStatus === "success" ? "bg-green-500" :
                  "bg-red-500"
                }`} />
                <span className={`font-dmSans text-[10px] uppercase tracking-[0.14em] ${
                  syncStatus === "syncing" ? "text-[#FF5500]" :
                  syncStatus === "success" ? "text-green-400" :
                  "text-red-400"
                }`}>
                  {syncStatus === "syncing" ? "Syncing..." :
                   syncStatus === "success" ? "Synced" :
                   "Sync Failed"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <ProfileContainer user={user} />
            <WeeklyScheduleCard plans={plans} />
          </div>

          <div className="flex flex-col gap-5">
            <StatsYearCard stats={statCards} />
            <HeatmapContainer data={heatmapData} />
          </div>
        </div>

        <div className="mt-6">
          <WeeklyGraph activities={activities} />
        </div>
        <div className="mt-6">
          <RecentActivity activities={activities} />
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardPage;