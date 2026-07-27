"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { computeSeasonSummary } from '../../lib/component-data';

const SeasonSummaryStrip = ({ races = [] }) => {
  const stats = useMemo(() => computeSeasonSummary(races), [races]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="bg-gradient-to-r from-accent-orange/20 to-bg-dark/20 border-t border-b border-accent-orange
                 py-6 px-8 md:px-16 flex flex-wrap justify-around items-center gap-6 rounded-lg mb-8"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="font-bebasNeue text-4xl text-text-primary leading-none">{stat.value}</p>
          <p className="font-dmSans text-sm text-text-secondary uppercase mt-1">{stat.label}</p>
        </div>
      ))}
    </motion.div>
  );
};

export default SeasonSummaryStrip;
