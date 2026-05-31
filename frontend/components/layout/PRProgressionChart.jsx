// frontend/components/layout/PRProgressionChart.jsx
"use client";

import React, { useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, useInView } from 'framer-motion';

const prProgressionData = [
  { date: '2022-01', time: 100 }, // Shorter time is better
  { date: '2022-03', time: 95 },
  { date: '2022-05', time: 92 },
  { date: '2022-07', time: 88 },
  { date: '2022-09', time: 85 },
  { date: '2022-11', time: 82 },
  { date: '2023-01', time: 80 },
  { date: '2023-03', time: 78 },
];

const PRProgressionChart = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const formatTime = (value) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <motion.div
      ref={ref}
      className="relative bg-surface-cards rounded-lg p-6 overflow-hidden border border-elevation-highlight"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-4">PR Progression (5km)</h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={prProgressionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3B414B" />
            <XAxis dataKey="date" stroke="#8F9BB3" className="font-dmSans text-sm" />
            {/* Inverted Y-axis for time (lower is better) */}
            <YAxis
              stroke="#8F9BB3"
              className="font-dmSans text-sm"
              domain={['dataMin - 10', 'dataMax + 10']}
              reversed={true}
              tickFormatter={formatTime}
              label={{ value: 'Time', angle: -90, position: 'insideLeft', fill: '#8F9BB3' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-bg-dark)', borderColor: 'var(--color-accent-orange)', borderRadius: '8px' }}
              labelStyle={{ color: 'var(--color-accent-orange)', fontFamily: 'var(--font-dm-sans)' }}
              itemStyle={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-dm-sans)' }}
              formatter={(value) => formatTime(value)}
            />
            <Line
              type="monotone"
              dataKey="time"
              stroke="#FFD700" // Podium gold
              strokeWidth={3}
              dot={{ stroke: '#FFD700', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 8, fill: '#FFD700', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Improvement Label */}
      <p className="font-dmSans text-text-secondary text-center mt-4">
        You&apos;ve improved by <span className="text-success-green">22 seconds</span> in the last year! Keep pushing!
      </p>
    </motion.div>
  );
};

export default PRProgressionChart;
