"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  formatRaceDate,
  formatRaceDistance,
  getOrdinalSuffix,
} from '../../lib/component-data';

const RaceHistoryCard = ({ race, index, onEdit }) => {
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

  const elevation = race.elevationGain ?? race.elevation;
  const positionSuffix = getOrdinalSuffix(race.position);

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
      <AnimatePresence>
        {isHovered && race.location && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-bg-dark flex items-center justify-center text-text-muted font-dmSans text-lg px-6 text-center"
          >
            {race.location}{race.terrain ? ` · ${race.terrain}` : ''}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 p-6 flex-1 lg:w-2/3">
        <h3 className="font-bebasNeue text-3xl text-text-primary mb-2">{race.name || '—'}</h3>
        <p className="font-dmSans text-sm text-text-secondary mb-4">
          {[race.type, race.location].filter(Boolean).join(' in ')}
          {race.date ? ` on ${formatRaceDate(race.date)}` : ''}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="font-bebasNeue text-xl text-accent-orange">{formatRaceDistance(race.distance)}</p>
            <p className="font-dmSans text-xs text-text-muted">Distance</p>
          </div>
          <div className="text-center">
            <p className="font-bebasNeue text-xl text-text-primary">{race.time || '—'}</p>
            <p className="font-dmSans text-xs text-text-muted">Time</p>
          </div>
          <div className="text-center">
            <p className="font-bebasNeue text-xl text-text-primary">
              {elevation != null ? `${Number(elevation).toLocaleString('en-US', { useGrouping: false })} m` : '—'}
            </p>
            <p className="font-dmSans text-xs text-text-muted">Elevation</p>
          </div>
        </div>

        {(race.story || race.description) && (
          <div className="bg-bg-dark p-4 rounded-md border border-chain-link-grey italic font-dmSans text-text-secondary text-sm">
            &quot;{race.story || race.description}&quot;
            {onEdit && (
              <button type="button" onClick={() => onEdit(race)} className="text-info-blue hover:underline ml-2 not-italic">
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative z-20 lg:w-1/3 bg-bg-dark p-6 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-elevation-highlight">
        <div className={`relative w-32 h-24 bg-white text-bg-dark rounded-md flex items-center justify-center flex-col shadow-md
                     ${getPodiumClass(race.position)} border-4`}
        >
          <span className="absolute top-1 left-1 w-2 h-2 bg-text-muted rounded-full" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-text-muted rounded-full" />
          <span className="absolute bottom-1 left-1 w-2 h-2 bg-text-muted rounded-full" />
          <span className="absolute bottom-1 right-1 w-2 h-2 bg-text-muted rounded-full" />

          <p className="font-bebasNeue text-5xl leading-none">{race.number ?? '—'}</p>
          <p className="font-dmSans text-xs uppercase">Race No.</p>
        </div>

        <div className="mt-4 text-center">
          {race.position ? (
            <>
              <p className="font-bebasNeue text-5xl leading-none text-accent-orange">
                {race.position}
                {positionSuffix && <span className="text-3xl align-super"> {positionSuffix}</span>}
              </p>
              {race.totalRiders && (
                <p className="font-dmSans text-sm text-text-secondary">out of {race.totalRiders} riders</p>
              )}
            </>
          ) : (
            <p className="font-dmSans text-sm text-text-muted">No result recorded</p>
          )}
        </div>

        {race.priority && (
          <span className="mt-4 px-3 py-1 bg-accent-orange/20 text-accent-orange rounded-full text-xs font-dmSans uppercase">
            Priority {race.priority}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default RaceHistoryCard;
