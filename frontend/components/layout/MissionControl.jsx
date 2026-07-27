"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { api, dispatchDataRefetch } from '../../lib/api';
import { useDataRefetch } from '../../lib/useDataRefetch';
import Loader from '../ui/Loader';

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const typeStyles = {
  rest: { label: 'Rest', color: 'bg-white/10' },
  recovery: { label: 'Recovery', color: 'bg-blue-400/60' },
  endurance: { label: 'Endurance', color: 'bg-emerald-500' },
  tempo: { label: 'Tempo', color: 'bg-amber-500' },
  threshold: { label: 'Threshold', color: 'bg-orange-500' },
  intervals: { label: 'Intervals', color: 'bg-red-500' },
  vo2max: { label: 'VO2 Max', color: 'bg-red-500' },
  race: { label: 'Race', color: 'bg-purple-500' },
  long: { label: 'Long Ride', color: 'bg-indigo-500' },
};

function detectType(type) {
  if (!type) return typeStyles.rest;
  const t = type.toLowerCase();
  if (t.includes('rest') || t.includes('off')) return typeStyles.rest;
  if (t.includes('recovery')) return typeStyles.recovery;
  if (t.includes('endurance') || t.includes('base')) return typeStyles.endurance;
  if (t.includes('tempo')) return typeStyles.tempo;
  if (t.includes('threshold') || t.includes('ftp')) return typeStyles.threshold;
  if (t.includes('interval') || t.includes('vo2')) return typeStyles.vo2max;
  if (t.includes('race') || t.includes('tt')) return typeStyles.race;
  if (t.includes('long')) return typeStyles.long;
  return typeStyles.tempo;
}

const MissionControl = ({ races = [], plan: planProp }) => {
  const [now, setNow] = useState(null);
  const [plan, setPlan] = useState(planProp || null);
  const [planLoading, setPlanLoading] = useState(!planProp);
  const refetchKey = useDataRefetch();

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (planProp) {
      setPlan(planProp);
      setPlanLoading(false);
      return;
    }
    setPlanLoading(true);
    api.get('/training-context/weekly-plan')
      .then((data) => setPlan(data))
      .catch(() => {})
      .finally(() => setPlanLoading(false));
  }, [planProp, refetchKey]);

  const today = now ? now.getDay() : 0;
  const todayDisplayIdx = (today + 6) % 7;

  const nextRace = useMemo(() => {
    if (!now) return null;
    return races
      .filter((r) => r.date && !r.completed && new Date(r.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [races, now]);

  const daysUntilRace = useMemo(() => {
    if (!nextRace || !now) return null;
    return Math.ceil((new Date(nextRace.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [nextRace, now]);

  const workoutMap = {};
  if (plan?.workouts) {
    for (const w of plan.workouts) {
      const displayIdx = (w.dayOfWeek + 6) % 7;
      workoutMap[displayIdx] = w;
    }
  }

  return (
    <motion.div
      className="relative bg-surface-cards rounded-lg p-6 overflow-hidden border border-elevation-highlight"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
    >
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-4">Mission Control</h2>

      <div className="flex items-center justify-between bg-bg-dark p-3 rounded-md mb-6 border border-chain-link-grey">
        <div className="flex items-center space-x-2">
          <motion.svg
            className="w-6 h-6 text-accent-orange"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </motion.svg>
          <p className="font-dmSans text-text-primary text-lg">
            {nextRace ? `${nextRace.name} In:` : 'No Upcoming Races'}
          </p>
        </div>
        <p className="font-bebasNeue text-3xl text-accent-orange">
          {daysUntilRace != null ? `${daysUntilRace} Days` : '--'}
        </p>
      </div>

      <h3 className="font-bebasNeue text-xl text-text-primary mb-3">Weekly Schedule</h3>
      {planLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader size={20} />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 text-center font-dmSans text-sm">
          {dayNames.map((day, displayIdx) => {
            const isToday = displayIdx === todayDisplayIdx;
            const workout = workoutMap[displayIdx];
            const style = workout ? detectType(workout.type) : typeStyles.rest;

            return (
              <div
                key={day}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-md ${
                  isToday
                    ? 'bg-accent-orange/20 border border-accent-orange'
                    : 'bg-bg-dark border border-chain-link-grey'
                }`}
              >
                <p className="font-bebasNeue text-text-primary text-xs">{day}</p>
                <span className={`h-2 w-2 rounded-full ${style.color}`} />
                <span className="text-[10px] text-text-secondary leading-tight">
                  {isToday ? 'Today' : (workout ? style.label : '—')}
                </span>
                {workout?.distance ? (
                  <span className="text-[9px] text-white/30">{parseFloat(workout.distance).toFixed(1)} km</span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <motion.button
        className="w-full mt-6 py-3 bg-accent-orange text-white font-dmSans rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={async () => {
          try {
            await api.post('/analysis/ensure-plans', {});
            dispatchDataRefetch();
          } catch {}
        }}
      >
        Generate Weekly Plan
      </motion.button>
    </motion.div>
  );
};

export default MissionControl;
