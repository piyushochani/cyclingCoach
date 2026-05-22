// frontend/components/layout/RaceHistoryCard.jsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const RaceHistoryCard = ({ race, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { delay: index * 0.1 } },
  };

  const getPodiumClass = (position) => {
    if (position === 1) return 'border-podium-gold';
    if (position === 2) return 'border-podium-silver';
    if (position === 3) return 'border-podium-bronze';
    return 'border-elevation-highlight';
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`relative bg-surface-cards rounded-lg shadow-lg overflow-hidden
                 flex flex-col lg:flex-row border ${getPodiumClass(race.position)}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Route Map Overlay (Placeholder) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-bg-dark flex items-center justify-center text-text-muted font-dmSans text-xl"
          >
            Route Map Preview (Placeholder)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Section: Race Details */}
      <div className="relative z-20 p-6 flex-1 lg:w-2/3">
        <h3 className="font-bebasNeue text-3xl text-text-primary mb-2">{race.name}</h3>
        <p className="font-dmSans text-sm text-text-secondary mb-4">
          {race.type} in {race.location} on {format(new Date(race.date), 'MMM dd, yyyy')}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="font-bebasNeue text-xl text-accent-orange">{race.distance} km</p>
            <p className="font-dmSans text-xs text-text-muted">Distance</p>
          </div>
          <div className="text-center">
            <p className="font-bebasNeue text-xl text-text-primary">{race.time}</p>
            <p className="font-dmSans text-xs text-text-muted">Time</p>
          </div>
          <div className="text-center">
            <p className="font-bebasNeue text-xl text-text-primary">{race.elevation} m</p>
            <p className="font-dmSans text-xs text-text-muted">Elevation</p>
          </div>
        </div>

        {/* Experience/Story Quote Block */}
        <div className="bg-bg-dark p-4 rounded-md border border-chain-link-grey italic font-dmSans text-text-secondary text-sm">
          &quot;{race.story}&quot;
          <button className="text-info-blue hover:underline ml-2">Edit</button>
        </div>
      </div>

      {/* Right Section: Race Number Plate / Results */}
      <div className="relative z-20 lg:w-1/3 bg-bg-dark p-6 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-elevation-highlight">
        {/* Race Number Plate */}
        <div className={`relative w-32 h-24 bg-white text-bg-dark rounded-md flex items-center justify-center flex-col shadow-md
                     ${getPodiumClass(race.position)} border-4`}
        >
          {/* Corner Bolts */}
          <span className="absolute top-1 left-1 w-2 h-2 bg-text-muted rounded-full"></span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-text-muted rounded-full"></span>
          <span className="absolute bottom-1 left-1 w-2 h-2 bg-text-muted rounded-full"></span>
          <span className="absolute bottom-1 right-1 w-2 h-2 bg-text-muted rounded-full"></span>

          <p className="font-bebasNeue text-5xl leading-none">{race.number}</p>
          <p className="font-dmSans text-xs uppercase">Race No.</p>
        </div>

        {/* Finishing Position */}
        <div className="mt-4 text-center">
          <p className="font-bebasNeue text-5xl leading-none text-accent-orange">{race.position}
            {race.position === 1 && <span className="text-3xl align-super">ST</span>}
            {race.position === 2 && <span className="text-3xl align-super">ND</span>}
            {race.position === 3 && <span className="text-3xl align-super">RD</span>}
            {race.position > 3 && <span className="text-3xl align-super">TH</span>}
          </p>
          <p className="font-dmSans text-sm text-text-secondary">out of {race.totalRiders} riders</p>
        </div>

        {/* XP Earned Pill */}
        <span className="mt-4 px-3 py-1 bg-success-green text-white rounded-full text-xs font-dmSans uppercase">
          +150 XP EARNED
        </span>
      </div>
    </motion.div>
  );
};

export default RaceHistoryCard;
