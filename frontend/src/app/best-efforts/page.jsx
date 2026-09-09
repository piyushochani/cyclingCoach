"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";
import { useDataRefetch } from "../../../lib/useDataRefetch";
import Loader from "../../../components/ui/Loader";

const SEGMENT_FILTERS = ["KOMs", "Top 10", "All"];

function formatTime(secs) {
  if (!secs) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}`;
  return `${m}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
}

function formatSpeed(ms) {
  if (!ms) return "—";
  return `${(ms * 3.6).toFixed(1)} km/h`;
}

function formatDistance(meters) {
  if (!meters) return "—";
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function diffLabel(efforts, i) {
  if (!efforts.length || i === 0) return null;
  const d = efforts[i].time - efforts[0].time;
  const m = Math.floor(d / 60);
  const s = d % 60;
  return `+${m > 0 ? `${m}m ` : ""}${s}s`;
}

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } };

function EffortCardMobile({ effort, i, efforts }) {
  const isPR = i === 0;

  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-xl border px-4 py-3.5 ${
        isPR ? "border-[#FF5500]/30 bg-[#FF5500]/5" : "border-white/[0.06] bg-black/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold ${isPR ? "text-white" : "text-white/75"}`}>
            {isPR ? "PR · " : `#${effort.rank} · `}
            {effort.name ?? `Ride · ${formatDate(effort.date)}`}
          </p>
          <p className="mt-1 text-[11px] text-white/30">{formatDistance(effort.distance)}</p>
        </div>
        <span className={`shrink-0 font-jetbrainsMono text-sm font-bold ${isPR ? "text-[#FF5500]" : "text-white/85"}`}>
          {formatSpeed(effort.avgSpeed)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 font-jetbrainsMono text-xs text-white/45">
        <span>{formatTime(effort.time)}</span>
        <span>{formatDate(effort.date)}</span>
        {!isPR && diffLabel(efforts, i) && <span>{diffLabel(efforts, i)}</span>}
      </div>
    </motion.div>
  );
}

function EffortRow({ effort, i, efforts }) {
  const isPR = i === 0;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`grid grid-cols-[40px_1fr_100px_95px_90px_70px] gap-2 border-b border-white/[0.04] px-4 py-3.5 transition-all duration-200 md:grid-cols-[40px_1fr_110px_110px_105px_80px] ${
        isPR ? "border-l-2 border-[#FF5500]" : "border-l-2 border-transparent"
      }`}
      style={{ background: hovered ? "rgba(255,255,255,0.025)" : isPR ? "rgba(255,85,0,0.03)" : "transparent" }}
    >
      <span className={`font-jetbrainsMono text-xs font-bold leading-8 ${isPR ? "text-[#FF5500]" : "text-white/20"}`}>
        {isPR ? "PR" : `#${effort.rank}`}
      </span>

      <div className="min-w-0">
        <p className={`truncate text-sm font-semibold leading-tight ${isPR ? "text-white" : "text-white/75"}`}>
          {effort.name ?? `Ride · ${formatDate(effort.date)}`}
          {effort.isFresh && (
            <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 font-dmSans text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-400">
              NEW
            </span>
          )}
        </p>
        <p className="mt-0.5 text-[11px] text-white/25">{formatDistance(effort.distance)}</p>
      </div>

      <span className={`font-jetbrainsMono text-sm font-bold leading-8 ${isPR ? "text-[#FF5500]" : "text-white/85"}`}>
        {formatSpeed(effort.avgSpeed)}
      </span>

      <span className="font-jetbrainsMono text-xs leading-8 text-white/35">{formatTime(effort.time)}</span>

      <span className="text-xs leading-8 text-white/25">{formatDate(effort.date)}</span>

      <span className={`font-jetbrainsMono text-xs leading-8 ${isPR ? "text-white/50" : "text-white/20"}`}>
        {isPR ? "—" : diffLabel(efforts, i)}
      </span>
    </motion.div>
  );
}

function LongestRideCardMobile({ effort, isFirst }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-xl border px-4 py-3.5 ${
        isFirst ? "border-[#FF5500]/30 bg-[#FF5500]/5" : "border-white/[0.06] bg-black/20"
      }`}
    >
      <p className={`truncate text-sm font-semibold ${isFirst ? "text-white" : "text-white/75"}`}>
        {isFirst ? "🏆 " : `#${effort.rank} · `}{effort.name}
      </p>
      <p className="mt-1 text-[11px] text-white/30">{effort.label}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 font-jetbrainsMono text-xs text-white/55">
        <span>{formatDistance(effort.distance)}</span>
        <span>{formatTime(effort.time)}</span>
        <span>{formatDate(effort.date)}</span>
      </div>
    </motion.div>
  );
}

function LongestRideRow({ effort, isFirst }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`grid grid-cols-[40px_1fr_100px_95px_90px] gap-2 border-b border-white/[0.04] px-4 py-3.5 transition-all duration-200 md:grid-cols-[40px_1fr_110px_110px_105px] ${
        isFirst ? "border-l-2 border-[#FF5500]" : "border-l-2 border-transparent"
      }`}
      style={{ background: hovered ? "rgba(255,255,255,0.025)" : isFirst ? "rgba(255,85,0,0.03)" : "transparent" }}
    >
      <span className={`font-jetbrainsMono text-xs font-bold leading-8 ${isFirst ? "text-yellow-400" : "text-white/20"}`}>
        {isFirst ? "🏆" : `#${effort.rank}`}
      </span>

      <div className="min-w-0">
        <p className={`truncate text-sm font-semibold leading-tight ${isFirst ? "text-white" : "text-white/75"}`}>
          {effort.name}
          {effort.isFresh && (
            <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 font-dmSans text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-400">
              NEW
            </span>
          )}
        </p>
        <p className="mt-0.5 text-[11px] text-white/25">{effort.label}</p>
      </div>

      <span className="font-jetbrainsMono text-sm font-bold leading-8 text-white/85">{formatDistance(effort.distance)}</span>

      <span className="font-jetbrainsMono text-xs leading-8 text-white/35">{formatTime(effort.time)}</span>

      <span className="text-xs leading-8 text-white/25">{formatDate(effort.date)}</span>
    </motion.div>
  );
}

function SegmentEffortCard({ effort }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-surface-cards px-4 py-3 transition-all hover:border-white/15">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          effort.isKom ? "bg-yellow-500/15" : (effort.komRank && effort.komRank <= 10) ? "bg-blue-500/15" : "bg-white/[0.04]"
        }`}>
          {effort.isKom ? (
            <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : effort.komRank && effort.komRank <= 10 ? (
            <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white/80">{effort.name}</p>
            {effort.isKom && (
              <span className="shrink-0 rounded-full bg-yellow-500/15 px-2 py-0.5 font-dmSans text-[9px] font-bold uppercase tracking-[0.08em] text-yellow-400">KOM</span>
            )}
            {effort.komRank && effort.komRank > 0 && effort.komRank <= 10 && !effort.isKom && (
              <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 font-dmSans text-[9px] font-bold uppercase tracking-[0.08em] text-blue-400">Top 10</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-white/25">{effort.segmentName}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-jetbrainsMono text-sm font-semibold text-white/70">{formatTime(effort.movingTime)}</p>
        {effort.komRank && effort.komRank > 0 && (
          <p className="font-dmSans text-[10px] text-yellow-400/60">#{effort.komRank} Overall</p>
        )}
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="my-px animate-pulse" style={{ height: 56, background: "rgba(255,255,255,0.03)", animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

export default function BestEffortsPage() {
  const [activeTab, setActiveTab] = useState(null);
  const [distanceTabs, setDistanceTabs] = useState([]);
  const [segmentFilter, setSegmentFilter] = useState("KOMs");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedFastest, setExpandedFastest] = useState(false);
  const [expandedLongest, setExpandedLongest] = useState(false);
  const [expandedSegments, setExpandedSegments] = useState(false);
  const refetchKey = useDataRefetch();

  const loadData = useCallback(async () => {
    const d = await api.get("/best-efforts").catch(() => null);
    if (d) {
      setData(d);
      const labels = [...new Set((d.bestEfforts || []).map((e) => e.label))].sort((a, b) => {
        const numA = parseFloat(a.replace(/,/g, ''));
        const numB = parseFloat(b.replace(/,/g, ''));
        return numA - numB;
      });
      setDistanceTabs(labels);
      if (labels.length > 0 && !activeTab) setActiveTab(labels[0]);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));

    api.post("/best-efforts/refresh", {}).then((res) => {
      if (res?.status === 'syncing') {
        setSyncing(true);
        const poll = setInterval(async () => {
          const status = await api.get("/best-efforts/status").catch(() => null);
          if (!status || status.status !== 'syncing') {
            clearInterval(poll);
            setSyncing(false);
            loadData();
          }
        }, 2000);
      }
    }).catch(() => {});
  }, [loadData, refetchKey]);

  const currentEfforts = (data?.bestEfforts || []).filter((e) => activeTab ? e.label === activeTab : true).sort((a, b) => a.rank - b.rank);
  const longestRides = data?.longestRides || [];
  const segments = data?.segments || { koms: [], top10: [], all: [] };

  const hasData = data && ((data?.bestEfforts || []).length > 0 ||
    (data?.longestRides || []).length > 0 ||
    (data?.segments?.all || []).length > 0);

  const filteredSegmentEfforts = useMemo(() => {
    if (segmentFilter === "KOMs") return segments.koms || [];
    if (segmentFilter === "Top 10") return segments.top10 || [];
    return segments.all || [];
  }, [segmentFilter, segments]);

  const summaryStats = useMemo(() => {
    const bes = data?.bestEfforts || [];
    return {
      totalEfforts: bes.length + longestRides.length,
      prs: bes.filter((e) => e.rank === 1).length,
      komCount: (segments.koms || []).length,
      longest: longestRides.length,
    };
  }, [data, longestRides, segments]);

  return (
    <div className="min-h-screen bg-black">
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
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Strava · Cycling
          </p>
          <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
            Best <span className="text-[#FF5500]">Efforts</span>
          </h1>
          <p className="mt-3 font-dmSans text-sm text-white/50">
            Your fastest rides, longest distances, and segment rankings.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <div className="rounded-2xl border border-white/[0.05] bg-surface-cards px-4 py-3.5">
            <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Total Efforts</p>
            <p className="font-jetbrainsMono mt-1 text-xl font-bold text-white">{summaryStats.totalEfforts}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.05] bg-surface-cards px-4 py-3.5">
            <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Personal Bests</p>
            <p className="font-jetbrainsMono mt-1 text-xl font-bold text-white">{summaryStats.prs}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.05] bg-surface-cards px-4 py-3.5">
            <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">KOMs / QOMs</p>
            <p className="font-jetbrainsMono mt-1 text-xl font-bold text-yellow-400">{summaryStats.komCount}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.05] bg-surface-cards px-4 py-3.5">
            <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Longest Rides</p>
            <p className="font-jetbrainsMono mt-1 text-xl font-bold text-white">{summaryStats.longest}</p>
          </div>
        </motion.div>

        {syncing && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#FF5500]/20 bg-[#FF5500]/5 px-4 py-2">
            <Loader size={14} />
            <span className="font-dmSans text-[11px] text-[#FF5500]/70">Syncing latest data from Strava...</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={32} />
          </div>
        ) : !hasData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03]">
              <svg className="h-8 w-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="font-dmSans text-sm text-white/20">Sync your Strava activities to see your best efforts here.</p>
          </motion.div>
        ) : (
          <>
            {/* FASTEST */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-barlowCondensed text-xl uppercase tracking-wide text-white">
                  <span className="text-[#FF5500]">Fastest</span>
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {distanceTabs.map((d) => {
                  const active = activeTab === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setActiveTab(d)}
                      className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${
                        active
                          ? "bg-[#FF5500] text-white border border-[#FF5500]"
                          : "border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition-all"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>

              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mb-10 rounded-2xl border border-white/[0.05] bg-surface-cards overflow-hidden"
              >
                <div className="space-y-2 p-3 lg:hidden">
                  {currentEfforts.length === 0 ? (
                    <div className="px-2 py-10 text-center">
                      <p className="font-dmSans text-sm text-white/20">No {activeTab} efforts yet.</p>
                    </div>
                  ) : (
                    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
                      {currentEfforts.map((effort, i) => (
                        <EffortCardMobile key={effort.id ?? i} effort={effort} i={i} efforts={currentEfforts} />
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="hidden lg:block">
                <div className="grid grid-cols-[40px_1fr_110px_110px_105px_80px] gap-2 border-b border-white/[0.06] px-4 py-2.5">
                  {["#", "Activity", "Speed", "Time", "Date", "Δ Best"].map((h) => (
                    <span key={h} className="font-dmSans text-[10px] font-bold uppercase tracking-[0.1em] text-white/20">{h}</span>
                  ))}
                </div>

                {currentEfforts.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="font-dmSans text-sm text-white/20">No {activeTab} efforts yet.</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="hidden" animate="show">
                    {currentEfforts.map((effort, i) => (
                      <EffortRow key={effort.id ?? i} effort={effort} i={i} efforts={currentEfforts} />
                    ))}
                  </motion.div>
                )}
                </div>
              </motion.div>
            </motion.div>

            {/* LONGEST RIDES */}
            {longestRides.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="font-barlowCondensed text-xl uppercase tracking-wide text-white">
                      <span className="text-[#FF5500]">Longest</span> Rides
                    </h2>
                    <div className="h-[1px] w-12 bg-gradient-to-r from-white/[0.06] to-transparent" />
                  </div>
                  {longestRides.length > 5 && (
                    <button
                      onClick={() => setExpandedLongest(!expandedLongest)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1 text-[11px] font-semibold tracking-wide text-white/40 transition hover:border-white/20 hover:text-white/70"
                    >
                      {expandedLongest ? "Show Less" : `Show All (${longestRides.length})`}
                      <svg className={`h-3 w-3 transition ${expandedLongest ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="mb-10 rounded-2xl border border-white/[0.05] bg-surface-cards overflow-hidden">
                  <div className="space-y-2 p-3 lg:hidden">
                    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
                      {(expandedLongest ? longestRides : longestRides.slice(0, 5)).map((ride, i) => (
                        <LongestRideCardMobile key={ride.id ?? i} effort={ride} isFirst={i === 0} />
                      ))}
                    </motion.div>
                  </div>

                  <div className="hidden lg:block">
                  <div className="grid grid-cols-[40px_1fr_110px_110px_105px] gap-2 border-b border-white/[0.06] px-4 py-2.5">
                    {["#", "Activity", "Distance", "Time", "Date"].map((h) => (
                      <span key={h} className="font-dmSans text-[10px] font-bold uppercase tracking-[0.1em] text-white/20">{h}</span>
                    ))}
                  </div>
                  <motion.div variants={stagger} initial="hidden" animate="show">
                    {(expandedLongest ? longestRides : longestRides.slice(0, 5)).map((ride, i) => (
                      <LongestRideRow key={ride.id ?? i} effort={ride} isFirst={i === 0} />
                    ))}
                  </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SEGMENTS */}
            {filteredSegmentEfforts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="font-barlowCondensed text-xl uppercase tracking-wide text-white">
                      <span className="text-[#FF5500]">Segments</span>
                    </h2>
                    <div className="h-[1px] w-12 bg-gradient-to-r from-white/[0.06] to-transparent" />
                  </div>
                  {filteredSegmentEfforts.length > 5 && (
                    <button
                      onClick={() => setExpandedSegments(!expandedSegments)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1 text-[11px] font-semibold tracking-wide text-white/40 transition hover:border-white/20 hover:text-white/70"
                    >
                      {expandedSegments ? "Show Less" : `Show All (${filteredSegmentEfforts.length})`}
                      <svg className={`h-3 w-3 transition ${expandedSegments ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {SEGMENT_FILTERS.map((f) => {
                    const active = segmentFilter === f;
                    return (
                      <button
                        key={f}
                        onClick={() => { setSegmentFilter(f); setExpandedSegments(false); }}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${
                          active
                            ? "bg-[#FF5500] text-white border border-[#FF5500]"
                            : "border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition-all"
                        }`}
                      >
                        {f}
                        <span className="ml-1.5 opacity-50">
                          ({f === "KOMs" ? (segments.koms || []).length : f === "Top 10" ? (segments.top10 || []).length : (segments.all || []).length})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {(expandedSegments ? filteredSegmentEfforts : filteredSegmentEfforts.slice(0, 5)).map((effort) => (
                    <SegmentEffortCard key={effort.id ?? effort.stravaId} effort={effort} />
                  ))}
                </div>
              </motion.div>
            )}
            </>
          )}
        </motion.main>
    </div>
  );
}
