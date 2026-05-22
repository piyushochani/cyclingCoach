// frontend/components/layout/MissionControl.jsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const MissionControl = ({ races = [] }) => {
  const [now, setNow] = useState(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setNow(new Date());
    });
  }, []);

  const today = now ? now.getDay() : 0;

  const nextRace = useMemo(() => {
    if (!now) return null;
    return races
      .filter((r) => new Date(r.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [races, now]);

  const daysUntilRace = useMemo(() => {
    if (!nextRace || !now) return null;
    return Math.ceil((new Date(nextRace.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [nextRace, now]);

  const weeklySchedule = [
    { day: 'Mon', workouts: ['Easy Ride'] },
    { day: 'Tue', workouts: ['Intervals'] },
    { day: 'Wed', workouts: ['Rest'] },
    { day: 'Thu', workouts: ['Tempo'] },
    { day: 'Fri', workouts: ['Long Ride'] },
    { day: 'Sat', workouts: ['Race Pace'] },
    { day: 'Sun', workouts: ['Recovery'] },
  ];

  return (
    <motion.div
      className="relative bg-surface-cards rounded-lg p-6 overflow-hidden border border-elevation-highlight"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
    >
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-4">Mission Control</h2>

      {/* Race Countdown Chip */}
      <div className="flex items-center justify-between bg-bg-dark p-3 rounded-md mb-6 border border-chain-link-grey">
        <div className="flex items-center space-x-2">
          {/* Clock SVG Placeholder */}
          <motion.svg
            className="w-6 h-6 text-accent-orange"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </motion.svg>
          <p className="font-dmSans text-text-primary text-lg">
            {nextRace ? `${nextRace.name} In:` : 'No Upcoming Races'}
          </p>
        </div>
        <p className="font-bebasNeue text-3xl text-accent-orange">
          {daysUntilRace ? `${daysUntilRace} Days` : '--'}
        </p>
      </div>

      {/* Weekly Schedule Grid */}
      <h3 className="font-bebasNeue text-xl text-text-primary mb-3">Weekly Schedule</h3>
      <div className="grid grid-cols-7 gap-1 text-center font-dmSans text-sm">
        {weeklySchedule.map((item, index) => (
          <div
            key={item.day}
            className={`flex flex-col p-2 rounded-md ${
              index === today -1 // -1 because getDay() is 0-indexed for Sunday
                ? 'bg-accent-orange/20 border border-accent-orange'
                : 'bg-bg-dark border border-chain-link-grey'
            }`}
          >
            <p className="font-bebasNeue text-text-primary mb-1">{item.day}</p>
            <div className="flex flex-col space-y-1">
              {item.workouts.map((workout, wIndex) => (
                <motion.span
                  key={wIndex}
                  className="bg-elevation-highlight text-text-secondary px-2 py-1 rounded-full text-xs cursor-help"
                  whileHover={{ scale: 1.05 }}
                  title={workout} // Tooltip placeholder
                >
                  {workout}
                </motion.span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Regenerate Plan Button */}
      <motion.button
        className="w-full mt-6 py-3 bg-accent-orange text-white font-dmSans rounded-md hover:bg-orange-600 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Regenerate Plan
      </motion.button>
    </motion.div>
  );
};

export default MissionControl;
