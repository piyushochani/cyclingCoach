"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import { useDataRefetch } from '../../../lib/useDataRefetch';
import ScheduleRaceModal from '../../../components/layout/ScheduleRaceModal';
import Loader from '../../../components/ui/Loader';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WORKOUT_LABELS = {
  rest: 'Rest', recovery: 'Recovery', endurance: 'Endurance',
  tempo: 'Tempo', threshold: 'Threshold', intervals: 'Intervals',
  vo2max: 'VO2 Max', race: 'Race Simulation', long: 'Long Ride',
  gym: 'Gym / Strength', mobility: 'Mobility', stretching: 'Stretching',
};

const WORKOUT_COLORS = {
  rest: '#6B7280', recovery: '#60A5FA', endurance: '#22C55E',
  tempo: '#FBBF24', threshold: '#F97316', intervals: '#EF4444',
  vo2max: '#A78BFA', race: '#FF5500', long: '#3B82F6',
  gym: '#EC4899', mobility: '#14B8A6', stretching: '#8B5CF6',
};

function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function getCurrentRelativeWeek() {
  try {
    const stored = localStorage.getItem("cyclogenai_user");
    if (stored) {
      const u = JSON.parse(stored);
      if (u.trainingStart) {
        const startMonday = getMonday(new Date(u.trainingStart));
        const todayMonday = getMonday(new Date());
        const diffMs = todayMonday.getTime() - startMonday.getTime();
        return Math.round(diffMs / (7 * 86400000));
      }
    }
  } catch {}
  const now = new Date();
  const thisMonday = getMonday(now);
  const trainingStart = thisMonday;
  const diffMs = thisMonday.getTime() - trainingStart.getTime();
  return Math.round(diffMs / (7 * 86400000));
}

function daysLeft(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function formatDuration(km, type) {
  const speeds = { rest: 0, recovery: 25, endurance: 28, tempo: 32, threshold: 35, intervals: 30, vo2max: 28, race: 38, long: 26, gym: 0, mobility: 0, stretching: 0 };
  const speed = speeds[type] || 28;
  if (!km || speed === 0) return '-';
  const min = Math.round((km / speed) * 60);
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
  return `${min}m`;
}

function determineWeekFocus(workouts) {
  const rideTypes = workouts.filter(w => !['mobility', 'stretching', 'gym', 'rest'].includes(w.type)).map(w => w.type);
  if (rideTypes.length === 0) return { label: 'Recovery / Off Week', color: '#6B7280' };

  const restRecovery = rideTypes.filter(t => t === 'rest' || t === 'recovery').length;
  if (restRecovery >= 4) return { label: 'Tapering / Recovery', color: '#60A5FA' };

  const highIntensity = rideTypes.filter(t => ['intervals', 'vo2max', 'threshold', 'tempo'].includes(t)).length;
  if (highIntensity >= 3) return { label: 'Intensity & Explosiveness', color: '#EF4444' };
  if (highIntensity >= 2) return { label: 'Mixed Intensity', color: '#F97316' };

  const endurance = rideTypes.filter(t => t === 'endurance' || t === 'long').length;
  if (endurance >= 3) return { label: 'Endurance Building', color: '#22C55E' };
  if (endurance >= 2) return { label: 'Base Endurance', color: '#3B82F6' };

  return { label: 'General Preparation', color: '#A78BFA' };
}

function priorityBadge(priority) {
  const colors = { A: 'bg-red-500/20 text-red-400 border-red-500/30', B: 'bg-orange-500/20 text-orange-400 border-orange-500/30', C: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  const cls = colors[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return `Type ${priority}`;
}

function shouldSuggestMobility(workouts, dayIndex) {
  const hasRide = workouts.some(w => w.dayOfWeek === dayIndex && !['rest', 'mobility', 'stretching', 'gym'].includes(w.type));
  const alreadyHasMobility = workouts.some(w => w.dayOfWeek === dayIndex && (w.type === 'mobility' || w.type === 'stretching'));
  if (!hasRide || alreadyHasMobility) return null;
  const otherDaysWithMobility = workouts.filter(w => w.type === 'mobility' || w.type === 'stretching');
  if (otherDaysWithMobility.length === 0) return 'mobility';
  const daysSinceLastMobility = dayIndex - Math.max(...otherDaysWithMobility.map(w => w.dayOfWeek));
  if (daysSinceLastMobility >= 2) return 'mobility';
  return null;
}

const AITrainingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [races, setRaces] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState({});
  const refetchKey = useDataRefetch();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [raceData, planData] = await Promise.all([
        api.get('/races').catch(() => []),
        api.get('/training-context/weekly-plan').catch(() => null),
      ]);
      setRaces(Array.isArray(raceData) ? raceData : []);
      setWeeklyPlan(planData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, refetchKey]);

  const toggleComplete = async (dayOfWeek, workoutIndex, completed) => {
    const key = `${dayOfWeek}-${workoutIndex}`;
    setCompleting(prev => ({ ...prev, [key]: true }));
    try {
      const rw = getCurrentRelativeWeek();
      const updated = await api.post('/training-context/weekly-plan/complete', { relativeWeek: rw, dayOfWeek, completed, workoutIndex });
      setWeeklyPlan(updated);
    } finally {
      setCompleting(prev => ({ ...prev, [key]: false }));
    }
  };

  const upcomingRaces = useMemo(() => {
    const now = new Date();
    return races
      .filter(r => r.date && new Date(r.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [races]);

  const nextRace = upcomingRaces[0] || null;

  const allWorkouts = useMemo(() => {
    return weeklyPlan?.workouts || [];
  }, [weeklyPlan]);

  const weekFocus = useMemo(() => {
    return allWorkouts.length ? determineWeekFocus(allWorkouts) : { label: 'No Plan', color: '#6B7280' };
  }, [allWorkouts]);

  const sortedWorkouts = useMemo(() => {
    return DAY_ORDER.map((day, idx) => {
      const dayWorkouts = allWorkouts.filter(w => w.dayOfWeek === idx);
      const suggested = shouldSuggestMobility(allWorkouts, idx);
      const sessions = [...dayWorkouts];
      if (suggested) {
        sessions.push({ dayOfWeek: idx, type: suggested, importance: 'low', completed: false, _suggested: true, distance: 0 });
      }
      return { day, index: idx, sessions };
    });
  }, [allWorkouts]);

  const totalWeeklyDistance = useMemo(() => {
    return allWorkouts.reduce((s, w) => s + (w.distance || 0), 0);
  }, [allWorkouts]);

  const totalWeeklyTime = useMemo(() => {
    return allWorkouts.reduce((s, w) => {
      if (!w.distance || !w.type) return s;
      const speeds = { rest: 0, recovery: 25, endurance: 28, tempo: 32, threshold: 35, intervals: 30, vo2max: 28, race: 38, long: 26, gym: 0, mobility: 0, stretching: 0 };
      const speed = speeds[w.type] || 28;
      if (speed === 0) return s;
      return s + (w.distance / speed) * 60;
    }, 0);
  }, [allWorkouts]);

  const sessionsToday = allWorkouts.filter(w => w.dayOfWeek === ((new Date().getDay() + 6) % 7)).length;

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
              AI <span className="text-[#FF5500]">Training</span>
            </h1>
            <div className="mt-3 h-[2px] w-9 rounded-full bg-[#FF5500]" />
          </div>
          <button onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-[#FF5500] px-5 py-2.5 font-dmSans text-sm font-semibold text-white hover:bg-[#FF5500]/90 transition-colors">
            + Schedule Race
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={32} />
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
                <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Ride Distance</p>
                <p className="font-jetbrainsMono mt-1 text-2xl font-bold text-white">{totalWeeklyDistance.toFixed(0)} <span className="text-xs text-white/30">km</span></p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#111318] px-5 py-4">
                <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Sessions Today</p>
                <p className="font-jetbrainsMono mt-1 text-2xl font-bold text-[#FF5500]">{sessionsToday || '---'}</p>
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
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <div><p className="font-dmSans text-[10px] uppercase tracking-wider text-white/30">Type</p><p className="font-dmSans text-sm font-medium text-white">{nextRace.type || '-'}</p></div>
                    <div><p className="font-dmSans text-[10px] uppercase tracking-wider text-white/30">Distance</p><p className="font-dmSans text-sm font-medium text-white">{nextRace.distance ? `${nextRace.distance} km` : '-'}</p></div>
                    <div><p className="font-dmSans text-[10px] uppercase tracking-wider text-white/30">Location</p><p className="font-dmSans text-sm font-medium text-white">{nextRace.location || '-'}</p></div>
                    <div><p className="font-dmSans text-[10px] uppercase tracking-wider text-white/30">Elevation</p><p className="font-dmSans text-sm font-medium text-white">{nextRace.elevationGain ? `${nextRace.elevationGain}m` : '-'}</p></div>
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

            {/* ── WEEKLY SCHEDULE ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="rounded-2xl border border-white/5 bg-[#111318] overflow-hidden"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white">This Week Schedule</h2>
                    <span className="rounded-full px-3 py-1 font-dmSans text-[11px] font-semibold" style={{ backgroundColor: `${weekFocus.color}15`, color: weekFocus.color }}>
                      {weekFocus.label}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-5 py-3 text-left font-dmSans text-[10px] uppercase tracking-wider text-white/30 font-bold w-[80px]">Day</th>
                          <th className="px-5 py-3 text-left font-dmSans text-[10px] uppercase tracking-wider text-white/30 font-bold">Session</th>
                          <th className="px-5 py-3 text-right font-dmSans text-[10px] uppercase tracking-wider text-white/30 font-bold w-[80px]">Details</th>
                          <th className="px-5 py-3 text-center font-dmSans text-[10px] uppercase tracking-wider text-white/30 font-bold w-[50px]">Done</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedWorkouts.map(({ day, index, sessions }) => {
                          const isToday = new Date().getDay() === (index + 1) % 7;
                          if (sessions.length === 0) {
                            return (
                              <tr key={day} className={`border-b border-white/[0.03] last:border-0 ${isToday ? 'bg-[#FF5500]/5' : ''}`}>
                                <td className="px-5 py-4"><span className={`font-dmSans text-sm ${isToday ? 'text-[#FF5500] font-semibold' : 'text-white/60'}`}>{isToday ? 'Today' : day.slice(0, 3)}</span></td>
                                <td className="px-5 py-4" colSpan={2}><span className="font-dmSans text-sm text-white/20 italic">---</span></td>
                                <td className="px-5 py-4 text-center"><span className="font-dmSans text-xs text-white/20">-</span></td>
                              </tr>
                            );
                          }
                          return sessions.map((session, si) => {
                            const isSuggested = session._suggested;
                            const sessionType = session.type || 'rest';
                            const color = WORKOUT_COLORS[sessionType] || '#6B7280';
                            const label = WORKOUT_LABELS[sessionType] || sessionType;
                            const isRideType = !['rest', 'mobility', 'stretching', 'gym'].includes(sessionType);
                            return (
                              <tr key={`${day}-${si}`} className={`border-b border-white/[0.03] last:border-0 ${isToday ? 'bg-[#FF5500]/5' : ''} ${isSuggested ? 'opacity-50' : ''}`}>
                                {si === 0 ? (
                                  <td className="px-5 py-4" rowSpan={sessions.length}>
                                    <div className="flex items-center gap-3">
                                      <span className={`font-dmSans text-sm ${isToday ? 'text-[#FF5500] font-semibold' : 'text-white/60'}`}>
                                        {isToday ? 'Today' : day.slice(0, 3)}
                                      </span>
                                    </div>
                                  </td>
                                ) : null}
                                <td className="px-5 py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                    <span className={`font-dmSans text-sm ${session.completed ? 'text-white/40 line-through' : 'text-white'} font-medium`}>
                                      {label}
                                    </span>
                                    {isSuggested && <span className="font-dmSans text-[10px] text-white/20 italic">suggested</span>}
                                  </div>
                                </td>
                                <td className="px-5 py-2.5 text-right">
                                  {isRideType && session.distance ? (
                                    <div>
                                      <span className="font-jetbrainsMono text-sm text-white">{session.distance} km</span>
                                      <span className="font-jetbrainsMono text-xs text-white/40 ml-2">{formatDuration(session.distance, sessionType)}</span>
                                    </div>
                                  ) : sessionType === 'gym' ? (
                                    <span className="font-dmSans text-xs text-white/40">45-60 min</span>
                                  ) : sessionType === 'mobility' || sessionType === 'stretching' ? (
                                    <span className="font-dmSans text-xs text-white/40">15-20 min</span>
                                  ) : (
                                    <span className="font-dmSans text-xs text-white/30">-</span>
                                  )}
                                </td>
                                <td className="px-5 py-2.5 text-center">
                                  {session.type === 'rest' || !['gym', 'mobility', 'stretching'].includes(session.type) ? (
                                    <span className="font-dmSans text-xs text-white/20">-</span>
                                  ) : (
                                    <button
                                      onClick={() => toggleComplete(index, si, !session.completed)}
                                      disabled={completing[`${index}-${si}`]}
                                      className={`inline-flex items-center justify-center w-5 h-5 rounded border transition-colors ${session.completed ? 'bg-[#FF5500] border-[#FF5500]' : 'border-white/20 hover:border-[#FF5500]/50'}`}
                                    >
                                      {session.completed && (
                                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          });
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
                  <h2 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white mb-4">All Upcoming Races</h2>
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