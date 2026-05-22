// frontend/components/layout/RaceBadgesSection.jsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';

const badges = [
  { name: 'First Century', icon: '🏅' },
  { name: 'Alps Conqueror', icon: '🏔️' },
  { name: 'Speed Demon', icon: '⚡' },
  { name: '1000km Club', icon: '🚴' },
];

const RaceBadgesSection = () => {
  return (
    <div className="bg-surface-cards rounded-lg p-6 mt-8 border border-elevation-highlight">
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-6">Race Badges</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {badges.map((badge, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="flex flex-col items-center p-4 bg-bg-dark rounded-lg border border-chain-link-grey"
          >
            <span className="text-4xl mb-2">{badge.icon}</span>
            <span className="font-dmSans text-text-primary text-sm">{badge.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RaceBadgesSection;
