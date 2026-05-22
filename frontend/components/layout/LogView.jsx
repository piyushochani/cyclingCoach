// frontend/components/layout/LogView.jsx
"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const LogView = () => {
  // Placeholder data for weekly log
  const weeklyLogData = [
    {
      week: 'Oct 23 - Oct 29',
      totalDistance: 150,
      totalTime: '5h 30m',
      days: [
        { day: 'Mon', activities: [{ id: 'a1', type: 'Cycling', planned: true, completed: true, distance: 30, time: '1h' }] },
        { day: 'Tue', activities: [{ id: 'a2', type: 'Running', planned: true, completed: false, distance: 10, time: '45m' }] },
        { day: 'Wed', activities: [] }, // Rest day
        { day: 'Thu', activities: [{ id: 'a3', type: 'Cycling', planned: true, completed: true, distance: 40, time: '1h 30m' }] },
        { day: 'Fri', activities: [{ id: 'a4', type: 'Swimming', planned: false, completed: true, distance: 2, time: '40m' }] },
        { day: 'Sat', activities: [{ id: 'a5', type: 'Cycling', planned: true, completed: true, distance: 70, time: '2h 20m' }] },
        { day: 'Sun', activities: [] },
      ],
    },
    {
      week: 'Oct 16 - Oct 22',
      totalDistance: 120,
      totalTime: '4h 00m',
      days: [
        { day: 'Mon', activities: [{ id: 'a6', type: 'Cycling', planned: true, completed: true, distance: 25, time: '1h' }] },
        { day: 'Tue', activities: [] },
        { day: 'Wed', activities: [{ id: 'a7', type: 'Running', planned: true, completed: true, distance: 8, time: '40m' }] },
        { day: 'Thu', activities: [] },
        { day: 'Fri', activities: [{ id: 'a8', type: 'Cycling', planned: true, completed: true, distance: 50, time: '1h 45m' }] },
        { day: 'Sat', activities: [] },
        { day: 'Sun', activities: [{ id: 'a9', type: 'Cycling', planned: false, completed: true, distance: 45, time: '1h 35m' }] },
      ],
    },
  ];

  const getSportColor = (type) => {
    switch (type) {
      case 'Cycling': return 'bg-info-blue';
      case 'Running': return 'bg-success-green';
      case 'Swimming': return 'bg-accent-orange';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      {weeklyLogData.map((week, weekIndex) => (
        <div key={weekIndex} className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight">
          {/* Week Header */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-chain-link-grey">
            <h3 className="font-bebasNeue text-xl text-text-primary">{week.week}</h3>
            <div className="flex space-x-4 font-dmSans text-sm text-text-secondary">
              <span>Distance: {week.totalDistance}km</span>
              <span>Time: {week.totalTime}</span>
            </div>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-4">
            {week.days.map((day, dayIndex) => (
              <div key={dayIndex} className="flex flex-col items-center">
                <p className="font-bebasNeue text-text-primary text-lg mb-2">{day.day}</p>
                <div className="flex flex-col space-y-2 w-full">
                  {day.activities.length > 0 ? (
                    day.activities.map((activity) => (
                      <Link href={`/activities/${activity.id}`} key={activity.id}>
                        <motion.div
                          className={`p-2 rounded-lg text-center cursor-pointer relative group
                                      ${getSportColor(activity.type)} ${activity.completed ? '' : 'opacity-70'}
                                      ${activity.planned ? 'border-2 border-dashed border-text-secondary' : ''}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <p className="font-dmSans text-white text-xs">{activity.type}</p>
                          <p className="font-dmSans text-white text-xs">{activity.distance}km / {activity.time}</p>
                          {activity.completed && (
                            <span className="absolute top-1 right-1 text-white text-xs">✔</span>
                          )}
                        </motion.div>
                      </Link>
                    ))
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
