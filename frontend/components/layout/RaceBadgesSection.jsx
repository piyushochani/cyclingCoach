"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { computeRaceBadges } from '../../lib/component-data';

const RaceBadgesSection = ({ stats, activities = [], races = [] }) => {
  const badges = useMemo(
    () => computeRaceBadges(stats, activities, races),
    [stats, activities, races]
  );

  return (
    <div className="bg-surface-cards rounded-lg p-6 mt-8 border border-elevation-highlight">
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-6">Race Badges</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {badges.map((badge) => (
          <motion.div
            key={badge.name}
            whileHover={{ y: -5 }}
            className={`flex flex-col items-center p-4 rounded-lg border ${
              badge.earned
                ? 'bg-bg-dark border-chain-link-grey'
                : 'bg-bg-dark/50 border-chain-link-grey/50 opacity-50'
            }`}
          >
            <span className="text-4xl mb-2">{badge.icon}</span>
            <span className="font-dmSans text-text-primary text-sm text-center">{badge.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RaceBadgesSection;
