// frontend/components/layout/AIPeriodization.jsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TypewriterText } from '../../src/app/ai-training/page'; // Reusing from AI Training page

const periodizationData = [
  { name: 'Base', duration: 8, fill: '#3498DB' }, // Info blue
  { name: 'Build', duration: 6, fill: '#FF6B00' }, // Accent orange
  { name: 'Peak', duration: 2, fill: '#FFD700' }, // Podium gold
  { name: 'Taper', duration: 1, fill: '#2ECC71' }, // Success green
  { name: 'Race', duration: 1, fill: '#E74C3C' }, // Error red
];

const AIPeriodization = () => {
  const currentWeek = 10; // Example: Current week in the training block

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight"
    >
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-4">AI Periodization Insights</h2>

      {/* Coach's Letter Card */}
      <div className="relative bg-bg-dark p-6 rounded-md mb-8 border border-chain-link-grey overflow-hidden">
        {/* Noise texture overlay */}
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.19'%3E%3Cpath d='M1 0h1v1H1V0zm3 0h1v1H4V0zM0 2h1v1H0V2zm2 2h1v1H2V4zm0-2h1v1H2V2zm0 4h1v1H2V6zM4 4h1v1H4V4zm0 2h1v1H4V6zM6 0h1v1H6V0zm-1 2h1v1H5V2zm-2 2h1v1H3V4zm-2 2h1v1H1V6zM5 0h1v1H5V0zM3 2h1v1H3V2zM0 4h1v1H0V4zM2 0h1v1H2V0zM4 2h1v1H4V2zM6 2h1v1H6V2zM3 4h1v1H3V4zM1 4h1v1H1V4zM0 6h1v1H0V6zM3 0h1v1H3V0zM6 4h1v1H6V4z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")` }}></div>
        <div className="relative z-10">
          <p className="font-dmSans text-text-primary italic mb-4">
            <TypewriterText text="Dear Athlete, your current training phase is 'Build'. We've intensified your interval sessions to maximize anaerobic threshold and boost your VO2 max. Remember to prioritize recovery on your off days. Consistency is key!" />
          </p>
          <p className="font-dmSans text-sm text-text-secondary text-right">- Coach AI</p>
        </div>
      </div>

      {/* Periodization Timeline Bar Chart */}
      <h3 className="font-bebasNeue text-xl text-text-primary mb-3">Your Training Cycles</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={periodizationData}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
          >
            <YAxis type="category" dataKey="name" stroke="#8F9BB3" className="font-dmSans text-sm" />
            <XAxis type="number" hide />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-bg-dark)', borderColor: 'var(--color-accent-orange)', borderRadius: '8px' }}
              labelStyle={{ color: 'var(--color-accent-orange)', fontFamily: 'var(--font-dm-sans)' }}
              itemStyle={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-dm-sans)' }}
            />
            <Bar dataKey="duration" fill="currentColor">
              {
                periodizationData.map((entry, index) => (
                  <Bar key={`bar-${index}`} fill={entry.fill} />
                ))
              }
            </Bar>
            {/* "YOU ARE HERE" marker */}
            <ReferenceLine x={currentWeek} stroke="#FF6B00" strokeDasharray="3 3" label={{ value: 'YOU ARE HERE', fill: '#FF6B00', position: 'top' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AIPeriodization;
