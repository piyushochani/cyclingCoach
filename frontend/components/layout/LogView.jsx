"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { buildWeeklyLogData } from '../../lib/component-data';

const sportColors = {
  Cycling: 'bg-info-blue',
  Running: 'bg-success-green',
  Swimming: 'bg-accent-orange',
  Workout: 'bg-purple-500',
  Hiking: 'bg-emerald-600',
};

const LogView = ({ activities = [], weeklyPlans = [] }) => {
  const weeklyLogData = useMemo(
    () => buildWeeklyLogData(activities, weeklyPlans),
    [activities, weeklyPlans]
  );

  const getSportColor = (type) => sportColors[type] || 'bg-gray-500';

  if (weeklyLogData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-elevation-highlight bg-surface-cards p-10 text-center"
      >
        <p className="font-dmSans text-sm text-text-secondary">No training log data yet.</p>
        <p className="font-dmSans text-xs text-text-muted mt-1">
          Activities and weekly plans will appear here once synced.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      {weeklyLogData.map((week, weekIndex) => (
        <div key={weekIndex} className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-chain-link-grey">
            <h3 className="font-bebasNeue text-xl text-text-primary">{week.week}</h3>
            <div className="flex space-x-4 font-dmSans text-sm text-text-secondary">
              <span>Distance: {week.totalDistance} km</span>
              <span>Time: {week.totalTime}</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {week.days.map((day, dayIndex) => (
              <div key={dayIndex} className="flex flex-col items-center">
                <p className="font-bebasNeue text-text-primary text-lg mb-2">{day.day}</p>
                <div className="flex flex-col space-y-2 w-full">
                  {day.activities.length > 0 ? (
                    day.activities.map((activity) => {
                      const content = (
                        <motion.div
                          className={`p-2 rounded-lg text-center cursor-pointer relative group
                                      ${getSportColor(activity.type)} ${activity.completed ? '' : 'opacity-70'}
                                      ${activity.planned ? 'border-2 border-dashed border-text-secondary' : ''}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <p className="font-dmSans text-white text-xs">{activity.type}</p>
                          <p className="font-dmSans text-white text-xs">
                            {activity.distance ? `${Number(activity.distance).toFixed(1)} km` : '—'} / {activity.time}
                          </p>
                          {activity.completed && (
                            <span className="absolute top-1 right-1 text-white text-xs">✔</span>
                          )}
                        </motion.div>
                      );

                      if (activity.planned || !activity.id || String(activity.id).startsWith('plan-')) {
                        return <div key={activity.id}>{content}</div>;
                      }

                      return (
                        <Link href={`/activities/${activity.id}`} key={activity.id}>
                          {content}
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-2 rounded-lg text-center bg-bg-dark text-text-muted text-xs">
                      Rest
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default LogView;
