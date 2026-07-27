"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { api } from "../../../lib/api";
import { useDataRefetch } from "../../../lib/useDataRefetch";
import WeeklyGoalCard from "../../../components/layout/WeeklyGoalCard";
import WeeklyScheduleCard from "../../../components/layout/WeekScheduleCard";
import StatsYearCard from "../../../components/layout/StatsYearCard";
import HeatmapContainer from "../../../components/layout/HeatmapContainer";
import WeeklyGraph from "../../../components/layout/WeeklyGraph";
import WeatherWidget from "../../../components/layout/WeatherWidget";
import RecentActivity from "../../../components/layout/RecentActivity";
import ProfileContainer from "../../../components/layout/ProfileContainer";
import MissionControl from "../../../components/layout/MissionControl";

const DashboardPage = () => {
  const pathname = usePathname();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [races, setRaces] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [syncInfo, setSyncInfo] = useState(null);
  const [user, setUser] = useState(null);
  const refetchKey = useDataRefetch();

  const loadDashboardData = useCallback(() => {
    Promise.all([
      api.get('/stats').catch((e) => { console.warn('Stats API failed:', e); return null; }),
      api.get('/activities').catch((e) => { console.warn('Activities API failed:', e); return []; }),
      api.get('/races').catch((e) => { console.warn('Races API failed:', e); return []; }),
      api.get('/training-context/weekly-plan').catch((e) => { console.warn('Weekly plan API failed:', e); return null; }),
      api.get('/sync/status').catch((e) => { console.warn('Sync status API failed:', e); return null; }),
    ])
      .then(([statsData, activitiesData, racesData, weeklyPlanData, syncData]) => {
        setStats(statsData);
        setActivities(activitiesData);
        setRaces(racesData);
        setWeeklyPlan(weeklyPlanData);
        setSyncInfo(syncData);
      });
  }, []);

  useEffect(() => {
    loadDashboardData();
    try {
      const stored = localStorage.getItem('cyclogenai_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, [loadDashboardData, refetchKey]);

  const statCards = useMemo(() => stats
    ? [
        { label: "Distance", value: (stats.totalDistance / 1000).toFixed(2), unit: "KM", accent: "→" },
        { label: "Time", value: (stats.totalDuration / 3600).toFixed(1), unit: "HRS", accent: "◷" },
        { label: "Elevation", value: stats.totalElevation >= 1000 ? (stats.totalElevation / 1000).toFixed(1) : stats.totalElevation.toFixed(0), unit: stats.totalElevation >= 1000 ? "KM" : "M", accent: "⟋" },
        { label: "Activities", value: stats.activityCount.toString(), unit: "", accent: "◈" },
        { label: "Races Played", value: races.length.toString(), unit: "", accent: "⬡" },
        { label: "Avg / Week", value: stats.activityCount > 0 ? ((stats.totalDistance / 1000) / Math.max(stats.activityCount, 1) * 4).toFixed(1) : "0", unit: "KM", accent: "∿" },
      ]
    : null, [stats, races]);

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
        <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
              Performance Dashboard
            </p>
            <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
              Your <span className="text-[#FF5500]">Dashboard</span>
            </h1>
            <p className="mt-3 max-w-2xl font-dmSans text-sm text-white/50 md:text-[15px]">
              Track your season, review training consistency, and monitor your
              current performance block.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <WeatherWidget />
            {syncInfo?.rateLimitExhausted && (
              <div className="flex items-center gap-2 self-start rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 md:self-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-dmSans text-[10px] uppercase tracking-[0.14em] text-red-400">
                  API rate limit hit
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <ProfileContainer user={user} />
            <WeeklyGoalCard activities={activities} />
            <WeeklyScheduleCard plan={weeklyPlan} />
            <MissionControl races={races} plan={weeklyPlan} />
          </div>

          <div className="flex flex-col gap-5">
            <StatsYearCard stats={statCards} />
            <HeatmapContainer activities={activities} />
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