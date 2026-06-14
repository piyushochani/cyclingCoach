"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { api } from '../../../lib/api';
import AnalysisModal from '../../../components/ui/AnalysisModal';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sportColors = {
  cycling: '#FF5500',
  running: '#60A5FA',
  workout: '#A78BFA',
  hiking: '#4ADE80',
  walking: '#FBBF24',
  other: '#6B7280',
};

function formatDuration(s) {
  if (!s) return '0';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDurationShort(s) {
  if (!s) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function CountUp({ value, suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    const duration = 1500;
    const step = Math.max(1, Math.floor(end / 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, duration / (end / step || 1));
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

function StatCard({ icon, label, value, suffix, delay, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-cards p-5 transition-all duration-300 hover:border-[#FF5500]/30 hover:shadow-[0_0_30px_rgba(255,85,0,0.06)]"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#FF5500]/5 blur-2xl transition-all duration-500 group-hover:bg-[#FF5500]/10" />
      <div className="relative z-[1]">
        <span className="mb-2 inline-block text-xl">{icon}</span>
        <div className="font-jetbrainsMono text-2xl font-bold text-white md:text-3xl">
          <CountUp value={value} suffix={suffix} />
        </div>
        <div className="font-dmSans mt-1 text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</div>
        {sub && <div className="font-dmSans mt-0.5 text-[10px] text-white/20">{sub}</div>}
      </div>
    </motion.div>
  );
}

function InsightCard({ icon, label, value, trend, color }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-cards px-4 py-3">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <div className="font-dmSans text-[10px] uppercase tracking-[0.1em] text-white/40">{label}</div>
        <div className="font-jetbrainsMono text-sm font-bold text-white">{value}</div>
      </div>
      {trend && (
        <span className={`font-jetbrainsMono text-xs ${trend.startsWith('+') ? 'text-[#4ADE80]' : 'text-[#FF5500]'}`}>
          {trend}
        </span>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#FF5500]/30 bg-surface-cards px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="font-dmSans text-xs text-white/50">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-jetbrainsMono text-sm font-bold text-white">
          {formatter ? formatter(p) : `${p.value.toLocaleString()} ${p.name === 'distance' ? 'km' : p.name === 'elevation' || p.name === 'elevationGain' ? 'm' : p.name === 'count' || p.name === 'activities' ? 'activities' : p.name === 'hours' || p.name === 'duration' ? 'hrs' : ''}`}
        </p>
      ))}
    </div>
  );
};

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [bestEfforts, setBestEfforts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [sportFilter, setSportFilter] = useState('all');
  const [analysisModal, setAnalysisModal] = useState({ open: false, type: 'monthly', activities: [], previousActivities: [], activityName: '' });

  useEffect(() => {
    Promise.all([
      api.get('/stats').catch(() => null),
      api.get('/activities').catch(() => []),
      api.get('/best-efforts').catch(() => null),
    ]).then(([s, a, be]) => {
      setStats(s);
      setActivities(a || []);
      setBestEfforts(be);
      setLoading(false);
    });
  }, []);

  const filteredActivities = useMemo(() => {
    let filtered = [...activities];
    const now = new Date();
    if (period === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter((a) => a.date && new Date(a.date) >= start);
    } else if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter((a) => a.date && new Date(a.date) >= start);
    } else if (period === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((a) => a.date && new Date(a.date) >= start);
    }
    if (sportFilter !== 'all') {
      filtered = filtered.filter((a) => (a.sport || '').toLowerCase() === sportFilter);
    }
    return filtered;
  }, [activities, period, sportFilter]);

  const weeklyData = useMemo(() => {
    const buckets = {};
    for (const a of filteredActivities) {
      const d = new Date(a.date);
      if (isNaN(d)) continue;
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!buckets[key]) buckets[key] = { week: key, distance: 0, elevation: 0, hours: 0, count: 0 };
      buckets[key].distance += a.distance || 0;
      buckets[key].elevation += a.elevationGain || 0;
      buckets[key].hours += (a.durationSeconds || 0) / 3600;
      buckets[key].count += 1;
    }
    return Object.values(buckets).sort((a, b) => a.week.localeCompare(b.week)).slice(-24);
  }, [filteredActivities]);

  const monthlyData = useMemo(() => {
    const buckets = {};
    for (const a of filteredActivities) {
      const d = new Date(a.date);
      if (isNaN(d)) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!buckets[key]) buckets[key] = { month: MONTHS[d.getMonth()], year: d.getFullYear(), distance: 0, elevation: 0, count: 0, hours: 0 };
      buckets[key].distance += a.distance || 0;
      buckets[key].elevation += a.elevationGain || 0;
      buckets[key].hours += (a.durationSeconds || 0) / 3600;
      buckets[key].count += 1;
    }
    return Object.values(buckets).sort((a, b) => a.year !== b.year ? a.year - b.year : MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)).slice(-12);
  }, [filteredActivities]);

  const sportDist = useMemo(() => {
    const counts = {};
    for (const a of filteredActivities) {
      const s = (a.sport || 'other').toLowerCase();
      counts[s] = (counts[s] || 0) + (a.distance || 0);
    }
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [filteredActivities]);

  const dayOfWeekData = useMemo(() => {
    const counts = {};
    for (const a of filteredActivities) {
      const d = new Date(a.date);
      if (isNaN(d)) continue;
      const day = DAYS[d.getDay()];
      if (!counts[day]) counts[day] = { day, count: 0, distance: 0, hours: 0 };
      counts[day].count += 1;
      counts[day].distance += a.distance || 0;
      counts[day].hours += (a.durationSeconds || 0) / 3600;
    }
    return DAYS.map((d) => counts[d] || { day: d, count: 0, distance: 0, hours: 0 });
  }, [filteredActivities]);

  const avgSpeedTrend = useMemo(() => {
    const buckets = {};
    for (const a of filteredActivities) {
      if (!a.distance || !a.durationSeconds) continue;
      const d = new Date(a.date);
      if (isNaN(d)) continue;
      const month = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (!buckets[month]) buckets[month] = { month, totalSpeed: 0, count: 0 };
      buckets[month].totalSpeed += a.distance / (a.durationSeconds / 3600);
      buckets[month].count += 1;
    }
    return Object.values(buckets).map((b) => ({ month: b.month, speed: parseFloat((b.totalSpeed / b.count).toFixed(2)) }));
  }, [filteredActivities]);

  const bestEffortsPanel = useMemo(() => {
    if (!bestEfforts?.fastest) return [];
    const labels = ['5 km', '10 km', '20 km', '50 km', '100 km'];
    return labels.map((label) => {
      const efforts = bestEfforts.fastest[label];
      if (!efforts?.length) return { label, best: null };
      return { label, best: efforts[0] };
    }).filter((e) => e.best);
  }, [bestEfforts]);

  const longestRides = useMemo(() => {
    if (!bestEfforts?.longestRides) return [];
    return bestEfforts.longestRides.slice(0, 5);
  }, [bestEfforts]);

  const totalDistance = useMemo(() => filteredActivities.reduce((s, a) => s + (a.distance || 0), 0), [filteredActivities]);
  const totalDuration = useMemo(() => filteredActivities.reduce((s, a) => s + (a.durationSeconds || 0), 0), [filteredActivities]);
  const totalElevation = useMemo(() => filteredActivities.reduce((s, a) => s + (a.elevationGain || 0), 0), [filteredActivities]);
  const activityCount = filteredActivities.length;
  const avgDistance = activityCount > 0 ? totalDistance / activityCount : 0;
  const avgDuration = activityCount > 0 ? totalDuration / activityCount : 0;
  const longestRideVal = useMemo(() => filteredActivities.reduce((m, a) => Math.max(m, a.distance || 0), 0), [filteredActivities]);
  const biggestElevDay = useMemo(() => filteredActivities.reduce((m, a) => Math.max(m, a.elevationGain || 0), 0), [filteredActivities]);

  const recentActivities = useMemo(() => {
    return [...filteredActivities].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
  }, [filteredActivities]);

  const performanceSummary = useMemo(() => {
    const now = new Date();
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const currStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const curr = { distance: 0, count: 0, hours: 0 };
    const prev = { distance: 0, count: 0, hours: 0 };

    for (const a of activities) {
      if (!a.date) continue;
      const d = new Date(a.date);
      if (d >= currStart && d <= now) {
        curr.distance += a.distance || 0;
        curr.count += 1;
        curr.hours += (a.durationSeconds || 0) / 3600;
      } else if (d >= prevStart && d <= prevEnd) {
        prev.distance += a.distance || 0;
        prev.count += 1;
        prev.hours += (a.durationSeconds || 0) / 3600;
      }
    }

    const pct = (currVal, prevVal) => {
      if (prevVal === 0) return '+100.00%';
      const change = ((currVal - prevVal) / prevVal) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    };

    return {
      distance: pct(curr.distance, prev.distance),
      count: pct(curr.count, prev.count),
      hours: pct(curr.hours, prev.hours),
      currDistance: parseFloat(curr.distance.toFixed(2)),
      currCount: curr.count,
      currHours: parseFloat(curr.hours.toFixed(2)),
    };
  }, [activities]);

  const allSports = useMemo(() => {
    const sports = new Set();
    for (const a of activities) sports.add((a.sport || 'other').toLowerCase());
    return ['all', ...Array.from(sports)];
  }, [activities]);

  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('cyclogenai_user') || '{}');
        return u.weeklyGoalKm ?? 100;
      } catch { return 100; }
    }
    return 100;
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const currentWeekDistance = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return activities
      .filter((a) => a.date && new Date(a.date) >= weekStart)
      .reduce((s, a) => s + (a.distance || 0), 0);
  }, [activities]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF5500] border-t-transparent" />
          <p className="font-dmSans text-sm text-white/30">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[55%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-[1] mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Performance Analytics
          </p>
          <h1 className="font-barlowCondensed text-5xl md:text-6xl">
            Your <span className="text-[#FF5500]">Numbers</span>
          </h1>
          <div className="mt-3 h-[2px] w-10 rounded-full bg-[#FF5500]" />
        </motion.div>

        {/* Weekly Goal Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.4 }}
          className="mb-6 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-surface-cards px-5 py-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5500]/10">
              <svg className="h-5 w-5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/40">
                Weekly Goal
              </p>
              <p className="font-jetbrainsMono mt-0.5 text-sm text-white">
                {currentWeekDistance.toFixed(2)} km / {weeklyGoal} km
              </p>
            </div>
          </div>
          <button
            onClick={() => { setGoalInput(String(weeklyGoal)); setShowGoalModal(true); }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-dmSans text-xs font-medium text-white/60 transition hover:border-[#FF5500]/30 hover:text-white"
          >
            Set Goal
          </button>
        </motion.div>

        {/* Set Goal Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowGoalModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-surface-cards p-6 shadow-2xl"
            >
              <h3 className="font-dmSans text-sm font-semibold text-white">Set Weekly Goal</h3>
              <p className="font-dmSans mt-1 text-xs text-white/40">Target distance in kilometers for this week.</p>
              <input
                type="number"
                step="0.1"
                min="1"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="mt-4 w-full rounded-xl border border-white/[0.08] bg-black px-4 py-3 font-jetbrainsMono text-sm text-white outline-none transition focus:border-[#FF5500]/50"
                placeholder="e.g. 150"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 font-dmSans text-sm text-white/50 transition hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const val = parseFloat(goalInput);
                    if (!(val > 0)) return;
                    try {
                      const u = JSON.parse(localStorage.getItem('cyclogenai_user') || '{}');
                      const email = u.email;
                      if (email) {
                        const updated = await api.put('/users/' + encodeURIComponent(email), { weeklyGoalKm: val });
                        localStorage.setItem('cyclogenai_user', JSON.stringify(updated));
                      }
                      setWeeklyGoal(val);
                    } catch (e) { console.error('Failed to save goal', e); }
                    setShowGoalModal(false);
                  }}
                  className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200 disabled:opacity-50"
                >
                  Save Goal
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Sticky Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="sticky top-20 z-30 -mx-4 mb-6 border-b border-white/[0.04] bg-black/95 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-white/[0.08] bg-surface-cards p-0.5">
              {[
                { key: 'all', label: 'All Time' },
                { key: 'year', label: 'Year' },
                { key: 'month', label: 'Month' },
                { key: 'week', label: 'Week' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${
                    period === p.key
                      ? 'bg-[#FF5500] text-white border border-[#FF5500]'
                      : 'border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition-all'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex rounded-xl border border-white/[0.08] bg-surface-cards p-0.5">
              {allSports.map((s) => (
                <button
                  key={s}
                  onClick={() => setSportFilter(s)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${
                    sportFilter === s
                      ? 'bg-[#FF5500] text-white border border-[#FF5500]'
                      : 'border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition-all'
                  }`}
                >
                  {s === 'all' ? 'All Sports' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <div className="ml-auto font-dmSans text-[10px] text-white/20">
              {activityCount} activities
            </div>
          </div>
        </motion.div>

        {/* Performance Summary Insight */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="mb-6 grid grid-cols-3 gap-3"
        >
          <InsightCard icon="📏" label="Volume vs Last Month" value={`${performanceSummary.currDistance} km`} trend={performanceSummary.distance} />
          <InsightCard icon="📋" label="Activities vs Last Month" value={`${performanceSummary.currCount}`} trend={performanceSummary.count} />
          <InsightCard icon="⏱️" label="Time vs Last Month" value={`${performanceSummary.currHours} hrs`} trend={performanceSummary.hours} />
        </motion.div>

        {/* KPI Strip */}
        <div className="mb-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <StatCard icon="🚴" label="Total Distance" value={totalDistance.toFixed(2)} suffix=" km" delay={0.1} sub={activityCount > 0 ? `Avg ${avgDistance.toFixed(2)} km` : undefined} />
          <StatCard icon="⏱️" label="Moving Time" value={formatDuration(totalDuration)} suffix="" delay={0.13} sub={activityCount > 0 ? `Avg ${formatDurationShort(avgDuration)}` : undefined} />
          <StatCard icon="🗻" label="Elevation" value={totalElevation.toFixed(2)} suffix=" m" delay={0.16} />
          <StatCard icon="📊" label="Activities" value={activityCount} suffix="" delay={0.19} />
          <StatCard icon="📈" label="Longest Ride" value={longestRideVal.toFixed(2)} suffix=" km" delay={0.22} />
          <StatCard icon="🏔️" label="Biggest Climb" value={biggestElevDay.toFixed(2)} suffix=" m" delay={0.25} />
        </div>

        {/* AI Review Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF5500]/10">
              <svg className="h-3.5 w-3.5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-dmSans text-xs uppercase tracking-[0.15em] text-white/40">AI Training Review</h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                const now = new Date();
                const today = now.toISOString().slice(0, 10);
                const dayActivities = activities.filter((a) => a.date && new Date(a.date).toISOString().slice(0, 10) === today);
                setAnalysisModal({ open: true, type: 'daily', activities: dayActivities, previousActivities: [], activityName: `Today (${today})` });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-cards px-4 py-2.5 text-sm font-dmSans text-white/70 transition-all duration-200 hover:border-[#FF5500]/30 hover:text-white"
            >
              <svg className="h-3.5 w-3.5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Daily Review
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const weekActivities = activities.filter((a) => a.date && new Date(a.date) >= weekStart && new Date(a.date) <= weekEnd);
                const prevWeekStart = new Date(weekStart);
                prevWeekStart.setDate(prevWeekStart.getDate() - 7);
                const prevWeekEnd = new Date(weekStart);
                prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
                const prevWeekActivities = activities.filter((a) => a.date && new Date(a.date) >= prevWeekStart && new Date(a.date) <= prevWeekEnd);
                setAnalysisModal({ open: true, type: 'weekly', activities: weekActivities, previousActivities: prevWeekActivities, activityName: `Week of ${weekStart.toISOString().slice(0, 10)}` });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-cards px-4 py-2.5 text-sm font-dmSans text-white/70 transition-all duration-200 hover:border-[#FF5500]/30 hover:text-white"
            >
              <svg className="h-3.5 w-3.5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Weekly Review
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                const monthActivities = activities.filter((a) => a.date && new Date(a.date) >= monthStart && new Date(a.date) <= monthEnd);
                const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                const prevMonthActivities = activities.filter((a) => a.date && new Date(a.date) >= prevMonthStart && new Date(a.date) <= prevMonthEnd);
                setAnalysisModal({ open: true, type: 'monthly', activities: monthActivities, previousActivities: prevMonthActivities, activityName: `${MONTHS[now.getMonth()]} ${now.getFullYear()}` });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-cards px-4 py-2.5 text-sm font-dmSans text-white/70 transition-all duration-200 hover:border-[#FF5500]/30 hover:text-white"
            >
              <svg className="h-3.5 w-3.5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Monthly Review
            </button>
          </div>
        </motion.div>

        {/* Trend Charts Row */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard title="Distance Over Time" delay={0.2}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={weeklyData.length > 0 ? weeklyData : monthlyData}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5500" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF5500" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey={weeklyData.length > 0 ? "week" : "month"} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} unit=" km" width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="distance" stroke="#FF5500" strokeWidth={2} fill="url(#distGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Time Over Time" delay={0.25}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={weeklyData.length > 0 ? weeklyData : monthlyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey={weeklyData.length > 0 ? "week" : "month"} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} unit=" hrs" width={40} />
                <Tooltip content={<CustomTooltip formatter={(p) => `${p.value.toFixed(1)} hrs`} />} cursor={{ fill: 'rgba(255,85,0,0.06)' }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={28} fill="#FF5500" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Elevation Over Time" delay={0.3}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={weeklyData.length > 0 ? weeklyData : monthlyData}>
                <defs>
                  <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5500" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF5500" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey={weeklyData.length > 0 ? "week" : "month"} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} unit=" m" width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="elevation" stroke="#FF5500" strokeWidth={2} fill="url(#elevGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Second Row: Best Efforts + Activity Frequency */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Best Efforts Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="rounded-2xl border border-white/[0.06] bg-surface-cards p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-dmSans text-xs uppercase tracking-[0.15em] text-white/40">Best Efforts</h3>
              <button
                onClick={() => {
                  const now = new Date();
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  const monthActivities = activities.filter((a) => a.date && new Date(a.date) >= monthStart && new Date(a.date) <= monthEnd);
                  setAnalysisModal({ open: true, type: 'monthly', activities: monthActivities, previousActivities: [], activityName: `${MONTHS[now.getMonth()]} ${now.getFullYear()} - Best Efforts` });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#080808] px-2.5 py-1.5 text-[10px] font-dmSans text-white/40 transition hover:border-[#FF5500]/30 hover:text-white/70"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Review
              </button>
            </div>
            {bestEffortsPanel.length > 0 ? (
              <div className="space-y-2.5">
                {bestEffortsPanel.map((e) => (
                  <div key={e.label} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#080808] px-4 py-2.5">
                    <div>
                      <div className="font-dmSans text-xs text-white/50">{e.label}</div>
                      <div className="font-jetbrainsMono text-sm text-white">{e.best.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-jetbrainsMono text-sm font-bold text-[#FF5500]">
                        {formatDurationShort(e.best.time)}
                      </div>
                      <div className="font-dmSans text-[10px] text-white/30">
                        {(e.best.avgSpeed * 3.6).toFixed(2)} km/h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="font-dmSans text-xs text-white/20">No best efforts data yet</p>
              </div>
            )}
          </motion.div>

          {/* Activity Frequency */}
          <ChartCard title="Activity Frequency by Week" delay={0.4}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={weeklyData.slice(-16)} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} width={30} allowDecimals={false} />
                <Tooltip content={<CustomTooltip formatter={(p) => `${p.value} activities`} />} cursor={{ fill: 'rgba(255,85,0,0.06)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28} fill="#FF5500" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Third Row: Training Quality + Sport Split */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Avg Speed Trend */}
          <ChartCard title="Average Speed Trend" delay={0.42}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={avgSpeedTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} unit=" km/h" width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="speed" stroke="#FF5500" strokeWidth={2.5} dot={{ fill: '#FF5500', r: 4 }} activeDot={{ r: 6, fill: '#FF5500' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Sport Split */}
          <ChartCard title="Sport Split by Distance" delay={0.45}>
            {sportDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={sportDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                    {sportDist.map((entry) => (
                      <Cell key={entry.name} fill={sportColors[entry.name.toLowerCase()] || '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="font-dmSans text-xs text-white/20">No data</p>
              </div>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {sportDist.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sportColors[entry.name.toLowerCase()] || '#6B7280' }} />
                  <span className="font-dmSans text-[10px] text-white/40">{entry.name}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Day of Week Pattern */}
          <ChartCard title="Day of Week Distribution" delay={0.48}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={dayOfWeekData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} width={25} allowDecimals={false} />
                <Tooltip content={<CustomTooltip formatter={(p) => `${p.value} activities`} />} cursor={{ fill: 'rgba(255,85,0,0.06)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {dayOfWeekData.map((_, i) => (
                    <Cell key={i} fill={i === 0 || i === 6 ? '#FF5500' : '#FF5500'} fillOpacity={i === 0 || i === 6 ? 0.5 : 0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Longest / Biggest Days + Recent Activities */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Longest Rides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.5 }}
            className="rounded-2xl border border-white/[0.06] bg-surface-cards p-6"
          >
            <h3 className="font-dmSans mb-4 text-xs uppercase tracking-[0.15em] text-white/40">Longest Rides</h3>
            {longestRides.length > 0 ? (
              <div className="space-y-2">
                {longestRides.map((ride, i) => (
                  <div key={ride.id || i} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#080808] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="font-jetbrainsMono text-xs text-white/20">#{i + 1}</span>
                      <div>
                        <div className="font-dmSans text-sm text-white">{ride.name}</div>
                        <div className="font-dmSans text-[10px] text-white/30">{formatDate(ride.date)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-jetbrainsMono text-sm font-bold text-[#FF5500]">{ride.label}</div>
                      <div className="font-dmSans text-[10px] text-white/30">{formatDurationShort(ride.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="font-dmSans text-xs text-white/20">No longest rides data yet</p>
              </div>
            )}
          </motion.div>

          {/* Recent Activities Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="rounded-2xl border border-white/[0.06] bg-surface-cards p-6"
          >
            <h3 className="font-dmSans mb-4 text-xs uppercase tracking-[0.15em] text-white/40">Recent Activities</h3>
            <div className="max-h-[340px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04] text-left">
                    <th className="font-dmSans pb-2 text-[10px] font-normal uppercase tracking-[0.1em] text-white/30">Date</th>
                    <th className="font-dmSans pb-2 text-[10px] font-normal uppercase tracking-[0.1em] text-white/30">Name</th>
                    <th className="font-dmSans pb-2 text-right text-[10px] font-normal uppercase tracking-[0.1em] text-white/30">Dist</th>
                    <th className="font-dmSans hidden pb-2 text-right text-[10px] font-normal uppercase tracking-[0.1em] text-white/30 md:table-cell">Time</th>
                    <th className="font-dmSans hidden pb-2 text-right text-[10px] font-normal uppercase tracking-[0.1em] text-white/30 lg:table-cell">Elev</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((a, i) => (
                    <tr key={a._id || i} className="border-b border-white/[0.02] transition-colors hover:bg-white/[0.02]">
                      <td className="font-dmSans py-2.5 pr-3 text-xs text-white/40">{formatDate(a.date)}</td>
                      <td className="font-dmSans py-2.5 pr-3 text-xs text-white/70">{a.name}</td>
                       <td className="font-jetbrainsMono py-2.5 text-right text-xs text-white">{(a.distance || 0).toFixed(2)} km</td>
                       <td className="font-jetbrainsMono hidden py-2.5 text-right text-xs text-white/60 md:table-cell">{formatDurationShort(a.durationSeconds || 0)}</td>
                       <td className="font-jetbrainsMono hidden py-2.5 text-right text-xs text-white/60 lg:table-cell">{(a.elevationGain || 0).toFixed(2)} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <AnalysisModal
        isOpen={analysisModal.open}
        onClose={() => setAnalysisModal({ ...analysisModal, open: false })}
        type={analysisModal.type}
        activities={analysisModal.activities}
        previousActivities={analysisModal.previousActivities}
        activityName={analysisModal.activityName}
      />
    </div>
  );
}

function ChartCard({ title, delay, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-2xl border border-white/[0.06] bg-surface-cards p-5"
    >
      <h3 className="font-dmSans mb-4 text-xs uppercase tracking-[0.15em] text-white/40">{title}</h3>
      <div className="h-[240px]">{children}</div>
    </motion.div>
  );
}
