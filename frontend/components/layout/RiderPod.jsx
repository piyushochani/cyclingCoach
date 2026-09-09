"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { activityDistanceKm, computeRaceBadges, fmtDist, fmtDuration } from '../../lib/component-data';

const RiderPod = ({ activities = [], stats = null, races = [] }) => {
  const [isSprintMode, setIsSprintMode] = useState(false);

  const monthlyKm = useMemo(() => {
    const now = new Date();
    return activities
      .filter((a) => {
        const d = new Date(a.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, a) => sum + activityDistanceKm(a), 0);
  }, [activities]);

  const totalKm = stats?.totalDistance
    ? stats.totalDistance / 1000
    : activities.reduce((s, a) => s + activityDistanceKm(a), 0);

  const badges = useMemo(
    () => computeRaceBadges(stats, activities, races).filter((b) => b.earned).slice(0, 5),
    [stats, activities, races]
  );

  const performanceScore = stats?.consistencyScore != null
    ? Math.min(100, Math.round(stats.consistencyScore))
    : stats?.activityCount
      ? Math.min(100, Math.round((totalKm / 5000) * 100))
      : null;

  return (
    <motion.div
      className="relative bg-surface-cards rounded-lg p-6 overflow-hidden border border-accent-orange/20"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="absolute top-0 left-0 w-1/2 h-full border-l-4 border-accent-orange" />
      <div className="absolute top-0 left-0 w-full h-1/2 border-t-4 border-accent-orange" />

      <div className="relative z-10 grid grid-cols-2 gap-4">
        <div className="col-span-2 flex justify-center mb-6">
          <motion.div
            className="w-48 h-24 bg-bg-dark rounded-full flex items-center justify-center"
            animate={{ rotateY: isSprintMode ? 180 : 0, scale: isSprintMode ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
            onHoverStart={() => setIsSprintMode(true)}
            onHoverEnd={() => setIsSprintMode(false)}
          >
            <svg className="w-full h-full text-text-primary" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="3">
              <circle cx="50" cy="70" r="20" />
              <circle cx="150" cy="70" r="20" />
              <path d="M50 70 L70 50 L130 50 L150 70" />
              <path d="M70 50 L70 30 L90 25 L130 50" />
              <path d="M70 50 L85 60" />
              <circle cx="85" cy="60" r="5" fill="currentColor" />
            </svg>
          </motion.div>
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-bg-dark p-4 rounded-md text-center">
            <p className="font-bebasNeue text-3xl text-accent-orange">{fmtDist(totalKm)}</p>
            <p className="font-dmSans text-sm text-text-secondary">Total KM</p>
          </div>
          <div className="bg-bg-dark p-4 rounded-md text-center">
            <p className="font-bebasNeue text-3xl text-text-primary">{fmtDist(monthlyKm)}</p>
            <p className="font-dmSans text-sm text-text-secondary">This Month</p>
          </div>
          <div className="bg-bg-dark p-4 rounded-md text-center">
            <p className="font-bebasNeue text-3xl text-text-primary">{performanceScore ?? '—'}</p>
            <p className="font-dmSans text-sm text-text-secondary">Consistency</p>
          </div>
          <div className="bg-bg-dark p-4 rounded-md text-center">
            <p className="font-bebasNeue text-3xl text-text-primary">{stats?.activityCount ?? activities.length}</p>
            <p className="font-dmSans text-sm text-text-secondary">Activities</p>
          </div>
        </div>

        <div className="col-span-2 mt-4">
          <h3 className="font-bebasNeue text-xl text-text-primary mb-2">Achievements</h3>
          {badges.length > 0 ? (
            <div className="flex space-x-2 overflow-x-auto custom-scrollbar p-2">
              {badges.map((badge) => (
                <div key={badge.name} className="flex-shrink-0 w-16 h-16 bg-bg-dark rounded-full flex flex-col items-center justify-center text-center px-1">
                  <span className="text-xl">{badge.icon}</span>
                  <span className="font-dmSans text-[8px] text-text-secondary leading-tight">{badge.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-dmSans text-sm text-text-muted">Keep riding to unlock achievements.</p>
          )}
        </div>

        <div className="col-span-2 mt-4 bg-bg-dark p-4 rounded-md">
          <h3 className="font-bebasNeue text-xl text-text-primary mb-2">Recent Training</h3>
          {activities.length > 0 ? (
            <div className="space-y-2">
              {[...activities]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3)
                .map((a) => (
                  <div key={a._id || a.id} className="flex justify-between font-dmSans text-sm text-text-secondary">
                    <span className="truncate mr-2">{a.name || 'Ride'}</span>
                    <span>{fmtDist(activityDistanceKm(a))} km · {fmtDuration(a.durationSeconds)}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="font-dmSans text-sm text-text-muted">No recent activities synced.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RiderPod;
