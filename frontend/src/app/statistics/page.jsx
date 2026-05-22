"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Ticker = ({ startValue, incrementPerSecond }) => {
  const [value, setValue] = useState(startValue);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(prev => prev + incrementPerSecond);
    }, 1000);
    return () => clearInterval(interval);
  }, [incrementPerSecond]);

  return <span>{value.toFixed(2)}</span>;
};

const StatTile = ({ label, value, unit, icon }) => (
  <div className="bg-surface-cards border border-border-subtle p-6 rounded-xl">
    <div className="text-accent-orange mb-2">{icon}</div>
    <div className="font-jetbrainsMono text-3xl text-white">{value}</div>
    <div className="font-bebasNeue text-text-muted">{label} {unit}</div>
  </div>
);

const StatisticsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto p-4 md:p-8"
    >
      <div className="flex items-center justify-between mb-12">
        <h1 className="font-bebasNeue text-7xl text-text-white uppercase">YOUR NUMBERS</h1>
        <div className="bg-surface-cards border border-accent-orange p-4 rounded-lg">
          <span className="font-jetbrainsMono text-accent-orange text-2xl">
            <Ticker startValue={53000.00} incrementPerSecond={0.0042} />
          </span>
          <span className="font-bebasNeue text-text-white ml-2">KM</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatTile label="LIFETIME KM" value="53,000" unit="KM" icon="🚴" />
        <StatTile label="ELEVATION" value="3.2" unit="EVERESTS" icon="🗻" />
        <StatTile label="MOVING HOURS" value="1,240" unit="HRS" icon="⏱️" />
        <StatTile label="LONGEST RIDE" value="210" unit="KM" icon="🛣️" />
        <StatTile label="FASTEST KM" value="1:45" unit="MIN/KM" icon="⚡" />
        <StatTile label="CALORIES" value="450k" unit="KCAL" icon="🔥" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-surface-cards border border-border-subtle p-8 rounded-xl h-[400px] flex items-center justify-center">
            <p className="text-text-muted">Monthly Distance Bar Chart Placeholder</p>
        </div>
        <div className="bg-surface-cards border border-border-subtle p-8 rounded-xl h-[400px] flex items-center justify-center">
            <p className="text-text-muted">Sport Distribution Wheel Placeholder</p>
        </div>
        <div className="bg-surface-cards border border-border-subtle p-8 rounded-xl h-[400px] flex items-center justify-center">
            <p className="text-text-muted">Monthly Elevation Chart Placeholder</p>
        </div>
        <div className="bg-surface-cards border border-border-subtle p-8 rounded-xl h-[400px] flex items-center justify-center">
            <p className="text-text-muted">Performance Score Trend Placeholder</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatisticsPage;
