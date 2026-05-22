// frontend/components/layout/RiderPod.jsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const RiderPod = ({ activities = [], stats = null }) => {
  const [isSprintMode, setIsSprintMode] = useState(false);

  const monthlyKm = activities
    .filter((a) => {
      const d = new Date(a.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, a) => sum + a.distance, 0)
    .toFixed(0);

  const coins = Math.floor(
    (stats?.totalDistance || 0) * 10 +
    (stats?.totalElevation || 0) * 0.5 +
    (stats?.activityCount || 0) * 50
  );

  const achievements = Math.min(stats?.activityCount || 0, 50);

  return (
    <motion.div
      className="relative bg-surface-cards rounded-lg p-6 overflow-hidden border border-accent-orange/20"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Orange L-shaped accent */}
      <div className="absolute top-0 left-0 w-1/2 h-full border-l-4 border-accent-orange"></div>
      <div className="absolute top-0 left-0 w-full h-1/2 border-t-4 border-accent-orange"></div>

      <div className="relative z-10 grid grid-cols-2 gap-4">
        {/* Animated Cyclist SVG (Placeholder) */}
        <div className="col-span-2 flex justify-center mb-6">
          <motion.div
            className="w-48 h-24 bg-bg-dark rounded-full flex items-center justify-center"
            animate={{
              rotateY: isSprintMode ? 180 : 0,
              scale: isSprintMode ? 1.05 : 1,
            }}
            transition={{ duration: 0.5 }}
            onHoverStart={() => setIsSprintMode(true)}
            onHoverEnd={() => setIsSprintMode(false)}
          >
            {/* Simple Cyclist SVG */}
            <svg
              className="w-full h-full text-text-primary"
              viewBox="0 0 200 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="70" r="20" /> {/* Front wheel */}
              <circle cx="150" cy="70" r="20" /> {/* Rear wheel */}
              <path d="M50 70 L70 50 L130 50 L150 70" /> {/* Frame bottom */}
              <path d="M70 50 L70 30 L90 25 L130 50" /> {/* Frame top, handlebar */}
              <path d="M70 50 L85 60" /> {/* Pedal arm */}
              {/* Animated pedals (placeholder) */}
              <circle cx="85" cy="60" r="5" fill="currentColor" />
            </svg>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-bg-dark p-4 rounded-md text-center">
            <p className="font-bebasNeue text-3xl text-accent-orange">{coins.toLocaleString()}</p>
            <p className="font-dmSans text-sm text-text-secondary">Coins</p>
          </div>
          <div className="bg-bg-dark p-4 rounded-md text-center">
            <p className="font-bebasNeue text-3xl text-text-primary">{monthlyKm} KM</p>
            <p className="font-dmSans text-sm text-text-secondary">Monthly</p>
          </div>
          <div className="bg-bg-dark p-4 rounded-md text-center">
            <p className="font-bebasNeue text-3xl text-text-primary">
              {stats ? Math.min(100, Math.round((stats.totalDistance / 5000) * 100)) : '--'}
            </p>
            <p className="font-dmSans text-sm text-text-secondary">Performance</p>
          </div>
          <div className="bg-bg-dark p-4 rounded-md text-center">
            <p className="font-bebasNeue text-3xl text-text-primary">{achievements}</p>
            <p className="font-dmSans text-sm text-text-secondary">Achievements</p>
          </div>
        </div>

        {/* Achievement Badges (Placeholder) */}
        <div className="col-span-2 mt-4">
          <h3 className="font-bebasNeue text-xl text-text-primary mb-2">Achievements</h3>
          <div className="flex space-x-2 overflow-x-auto custom-scrollbar p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-16 h-16 bg-bg-dark rounded-full flex items-center justify-center text-text-muted text-sm">
                Badge {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* AI Diet Plan (Placeholder) */}
        <div className="col-span-2 mt-4 bg-bg-dark p-4 rounded-md">
          <h3 className="font-bebasNeue text-xl text-text-primary mb-2">AI Diet Plan</h3>
          <p className="font-dmSans text-text-secondary text-sm">Meal details and macro bars...</p>
        </div>
      </div>
    </motion.div>
  );
};

export default RiderPod;
