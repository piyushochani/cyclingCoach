// frontend/components/layout/WeeklyMileageGraph.jsx
"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine }
from 'recharts';
import { motion } from 'framer-motion';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeeklyMileageGraph = ({ activities = [] }) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyActivities = activities.filter((a) => new Date(a.date) >= weekAgo);

  const data = dayLabels.map((name, i) => {
    const dayKm = weeklyActivities
      .filter((a) => new Date(a.date).getDay() === i)
      .reduce((sum, a) => sum + a.distance, 0);
    return { name, km: Math.round(dayKm * 10) / 10 };
  });
  return (
    <motion.div
      className="relative bg-surface-cards rounded-lg p-6 overflow-hidden border border-elevation-highlight"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
    >
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-4">Weekly Mileage</h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3B414B" /> {/* chain-link-grey */}
            <XAxis dataKey="name" stroke="#8F9BB3" className="font-dmSans text-sm" /> {/* text-secondary */}
            <YAxis stroke="#8F9BB3" className="font-dmSans text-sm" label={{ value: 'Kilometers', angle: -90, position: 'insideLeft', fill: '#8F9BB3' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-bg-dark)', borderColor: 'var(--color-accent-orange)', borderRadius: '8px' }}
              labelStyle={{ color: 'var(--color-accent-orange)', fontFamily: 'var(--font-dm-sans)' }}
              itemStyle={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-dm-sans)' }}
            />
            <ReferenceLine x="Sun" stroke="red" strokeDasharray="3 3" label={{ value: 'This week', fill: 'red', position: 'insideTopRight' }} /> {/* "This week" marker */}
            <Line
              type="monotone"
              dataKey="km"
              stroke="#FF6B00" // accent-orange
              strokeWidth={3}
              dot={{ stroke: '#FF6B00', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 8, fill: '#FF6B00', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Hover Stats Panel - Placeholder for now */}
      <div className="mt-4 p-3 bg-bg-dark rounded-md text-center">
        <p className="font-dmSans text-text-secondary">Hover over the graph for detailed stats.</p>
      </div>
    </motion.div>
  );
};

export default WeeklyMileageGraph;
