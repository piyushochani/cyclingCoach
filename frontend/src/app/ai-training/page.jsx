"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import ScheduleRaceButton from '../../../components/layout/ScheduleRaceButton';
import ScheduleRaceModal from '../../../components/layout/ScheduleRaceModal';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WORKOUT_LABELS = {
  rest: 'Rest', recovery: 'Recovery', endurance: 'Endurance',
  tempo: 'Tempo', threshold: 'Threshold', intervals: 'Intervals',
  vo2max: 'VO2 Max', race: 'Race Simulation', long: 'Long Ride',
};

const WORKOUT_COLORS = {
  rest: '#6B7280', recovery: '#60A5FA', endurance: '#22C55E',
  tempo: '#FBBF24', threshold: '#F97316', intervals: '#EF4444',
  vo2max: '#A78BFA', race: '#FF5500', long: '#3B82F6',
};

function daysLeft(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function formatDuration(km, type) {
  const speeds = { rest: 0, recovery: 25, endurance: 28, tempo: 32, threshold: 35, intervals: 30, vo2max: 28, race: 38, long: 26 };
  const speed = speeds[type] || 28;
  if (!km || speed === 0) return '-';
  const min = Math.round((km / speed) * 60);
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
  return `${min}m`;
}

function determineWeekFocus(workouts) {
  const types = workouts.map(w => w.type).filter(Boolean);
  if (types.length === 0) return { label: 'Recovery / Off Week', color: '#6B7280' };

  const restRecovery = types.filter(t => t === 'rest' || t === 'recovery').length;
  if (restRecovery >= 4) return { label: 'Tapering / Recovery', color: '#60A5FA' };

  const highIntensity = types.filter(t => ['intervals', 'vo2max', 'threshold', 'tempo'].includes(t)).length;
  if (highIntensity >= 3) return { label: 'Intensity & Explosiveness', color: '#EF4444' };
  if (highIntensity >= 2) return { label: 'Mixed Intensity', color: '#F97316' };

  const endurance = types.filter(t => t === 'endurance' || t === 'long').length;
  if (endurance >= 3) return { label: 'Endurance Building', color: '#22C55E' };
  if (endurance >= 2) return { label: 'Base Endurance', color: '#3B82F6' };

  return { label: 'General Preparation', color: '#A78BFA' };
}

function priorityBadge(priority) {
  const colors = { A: 'bg-red-500/20 text-red-400 border-red-500/30', B: 'bg-orange-500/20 text-orange-400 border-orange-500/30', C: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  const cls = colors[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return `Type ${priority}`;
}

const AITrainingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [races, setRaces] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [raceData, planData] = await Promise.all([
        api.get('/races').catch(() => []),
        api.get('/training-context/weekly-plan?relativeWeek=0').catch(() => null),
      ]);
      setRaces(Array.isArray(raceData) ? raceData : []);
      setWeeklyPlan(planData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upcomingRaces = useMemo(() => {
    const now = new Date();
    return races
      .filter(r => r.date && new Date(r.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [races]);

  const nextRace = upcomingRaces[0] || null;

  const weekFocus = useMemo(() => {
    return weeklyPlan?.workouts ? determineWeekFocus(weeklyPlan.workouts) : { label: 'No Plan', color: '#6B7280' };
  }, [weeklyPlan]);

  const sortedWorkouts = useMemo(() => {
    if (!weeklyPlan?.workouts) return [];
    return DAY_ORDER.map((day, idx) => {
      const w = weeklyPlan.workouts.find(w => w.dayOfWeek === idx) || null;
      return { day, index: idx, workout: w };
    });
  }, [weeklyPlan]);

  const totalWeeklyDistance = useMemo(() => {
    return sortedWorkouts.reduce((s, w) => s + (w.workout?.distance || 0), 0);
  }, [sortedWorkouts]);

  const totalWeeklyTime = useMemo(() => {
    return sortedWorkouts.reduce((s, w) => {
      if (!w.workout?.distance || !w.workout?.type) return s;
      const speeds = { rest: 0, recovery: 25, endurance: 28, tempo: 32, threshold: 35, intervals: 30, vo2max: 28, race: 38, long: 26 };
      const speed = speeds[w.workout.type] || 28;
      return s + (w.workout.distance / speed) * 60;
    }, 0);
  }, [sortedWorkouts]);

  return (
    <div className="min-h-screen bg-black text-white">
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
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
              Intelligence Hub
            </p>
            <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
              AI Training <span className="text-[#FF5500]">Command</span>
            </h1>
            <div className="mt-3 h-[2px] w-9 rounded-full bg-[#FF5500]" />
          </div>
          <div className="flex flex-col items-end gap-3 w-full max-w-[260px] md:max-w-sm">
            <div className="relative w-full">
              <ScheduleRaceButton onClick={() => setIsModalOpen(true)} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF5500] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* ── STATS ROW ── */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/5 bg-[#111318] px-5 py-4">
                <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Races Scheduled</p>
                <p className="font-jetbrainsMono mt-1 text-2xl font-bold text-white">{upcomingRaces.length}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#111318] px-5 py-4">
                <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Week Focus</p>
                <p className="font-jetbrainsMono mt-1 text-lg font-bold" style={{ color: weekFocus.color }}>{weekFocus.label}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#111318] px-5 py-4">
                <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">This Week Distance</p>
                <p className="font-jetbrainsMono mt-1 text-2xl font-bold text-white">{totalWeeklyDistance.toFixed(0)} <span className="text-xs text-white/30">km</span></p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#111318] px-5 py-4">
                <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">This Week Volume</p>
                <p className="font-jetbrainsMono mt-1 text-2xl font-bold text-[#FF5500]">{totalWeeklyTime >= 60 ? `${(totalWeeklyTime / 60).toFixed(1)}h` : `${Math.round(totalWeeklyTime)}m`}</p>
              </div>
            </div>

            {/* ── UPCOMING RACE BAR ── */}
            {nextRace ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#1a1a22] to-[#111318] p-6 md:p-8"
              >
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#FF5500]/5 to-transparent" />
                <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  {/* Days Left */}
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center">
                      <span className="font-barlowCondensed text-5xl font-bold text-[#FF5500] leading-none">{daysLeft(nextRace.date)}</span>
                      <span className="font-dmSans text-[10px] uppercase tracking-wider text-white/40 mt-1">days left</span>
                    </div>
                    <div className="h-12 w-px bg-white/10" />
                    <div>
                      <span className={`inline-block rounded-full border px-3 py-0.5 font-dmSans text-[11px] font-semibold tracking-wide ${priorityBadge(nextRace.priority).split(' ').slice(0, -1).join(' ')}`}>
                        {priorityBadge(nextRace.priority)}
                      </span>
                      <h3 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white mt-1">{nextRace.name}</h3>
                    </div>
                  </div>

                  {/* Race Details */}
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <div>
                      <p className="font-dmSans text-[10px] uppercase tracking-wider text-white/30">Type</p>
                      <p className="font-dmSans text-sm font-medium text-white">{nextRace.type || '-'}</p>
                    </div>
                    <div>
                      <p className="font-dmSans text-[10px] uppercase tracking-wider text-white/30">Distance</p>
                      <p className="font-dmSans text-sm font-medium text-white">{nextRace.distance ? `${nextRace.distance} km` : '-'}</p>
                    </div>
                    <div>
                      <p className="font-dmSans text-[10px] uppercase tracking-wider text-white/30">Location</p>
                      <p className="font-dmSans text-sm font-medium text-white">{nextRace.location || '-'}</p>
                    </div>
                    <div>
                      <p className="font-dmSans text-[10px] uppercase tracking-wider text-white/30">Elevation</p>
                      <p className="font-dmSans text-sm font-medium text-white">{nextRace.elevationGain ? `${nextRace.elevationGain}m` : '-'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-white/10 bg-[#111318]/50 px-6 py-10 text-center"
              >
                <p className="font-dmSans text-sm text-white/30">No upcoming races scheduled.</p>
                <p className="font-dmSans text-xs text-white/20 mt-1">Click "Schedule Race" above to set your next target.</p>
              </motion.div>
            )}

            {/* ── WEEKLY SCHEDULE & MORE RACES ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Week Schedule Table */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="rounded-2xl border border-white/5 bg-[#111318] overflow-hidden"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="font-bebasNeue text-2xl text-white tracking-wide">This Week Schedule</h2>
                    <span
                      className="rounded-full px-3 py-1 font-dmSans text-[11px] font-semibold"
                      style={{ backgroundColor: `${weekFocus.color}15`, color: weekFocus.color }}
                    >
                      {weekFocus.label}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-5 py-3 text-left font-dmSans text-[10px] uppercase tracking-wider text-white/30 font-medium">Day</th>
                          <th className="px-5 py-3 text-left font-dmSans text-[10px] uppercase tracking-wider text-white/30 font-medium">Ride</th>
                          <th className="px-5 py-3 text-right font-dmSans text-[10px] uppercase tracking-wider text-white/30 font-medium">Distance</th>
                          <th className="px-5 py-3 text-right font-dmSans text-[10px] uppercase tracking-wider text-white/30 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedWorkouts.map(({ day, index, workout }) => {
                          const isToday = new Date().getDay() === (index + 1) % 7;
                          return (
                            <tr key={day} className={`border-b border-white/[0.03] last:border-0 ${isToday ? 'bg-[#FF5500]/5' : ''}`}>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  {workout && (
                                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: WORKOUT_COLORS[workout.type] || '#6B7280' }} />
                                  )}
                                  <span className={`font-dmSans text-sm ${isToday ? 'text-[#FF5500] font-semibold' : 'text-white/60'}`}>
                                    {isToday ? 'Today' : day.slice(0, 3)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                {workout ? (
                                  <span className="font-dmSans text-sm text-white font-medium">
                                    {WORKOUT_LABELS[workout.type] || workout.type || 'Rest'}
                                  </span>
                                ) : (
                                  <span className="font-dmSans text-sm text-white/20 italic">---</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {workout && workout.distance ? (
                                  <span className="font-jetbrainsMono text-sm text-white">{workout.distance} km</span>
                                ) : (
                                  <span className="font-jetbrainsMono text-sm text-white/20">-</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {workout && workout.distance && workout.type && workout.type !== 'rest' ? (
                                  <span className="font-jetbrainsMono text-sm text-white/70">{formatDuration(workout.distance, workout.type)}</span>
                                ) : (
                                  <span className="font-jetbrainsMono text-sm text-white/20">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </div>

              {/* Right Panel - All Upcoming Races */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="rounded-2xl border border-white/5 bg-[#111318] p-6"
                >
                  <h2 className="font-bebasNeue text-2xl text-white mb-4 tracking-wide">All Upcoming Races</h2>
                  {upcomingRaces.length === 0 ? (
                    <p className="font-dmSans text-sm text-white/30">No races scheduled yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingRaces.map((race, i) => {
                        const dl = daysLeft(race.date);
                        return (
                          <div key={race._id || i} className="rounded-xl border border-white/5 bg-black/30 p-4 hover:border-[#FF5500]/20 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-semibold font-dmSans uppercase tracking-wider ${priorityBadge(race.priority).split(' ').slice(0, -1).join(' ')}`}>
                                Type {race.priority}
                              </span>
                              <span className="font-jetbrainsMono text-xs text-[#FF5500]">{dl}d</span>
                            </div>
                            <p className="font-dmSans text-sm font-medium text-white">{race.name}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40 font-dmSans">
                              <span>{race.type || '-'}</span>
                              {race.distance && <span>{race.distance} km</span>}
                              {race.location && <span>{race.location}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        )}

        <ScheduleRaceModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchData(); }} />
      </motion.main>
    </div>
  );
};

export default AITrainingPage;