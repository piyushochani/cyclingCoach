"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AddRaceResultButton from '../../../components/ui/AddRaceResultButton';
import RaceBadgesSection from '../../../components/layout/RaceBadgesSection';
import AddRaceResultModal from '../../../components/layout/AddRaceResultModal';
import SeasonSummaryStrip from '../../../components/layout/SeasonSummaryStrip';
import RaceHistoryCard from '../../../components/layout/RaceHistoryCard';

const dummyRaces = [
  { id: 1, name: "Patas Race 2026", type: "Road", location: "Patagonia", date: "May 15, 2026", distance: 150, elevation: 2200, time: "4:12:00", position: 3, number: 42, totalRiders: 120, story: "Epic climb, challenging weather." },
  { id: 2, name: "City Criterium", type: "Crit", location: "New York", date: "April 20, 2026", distance: 45, elevation: 150, time: "1:05:00", position: 12, number: 18, totalRiders: 80, story: "Fast and technical corners." }
];

const RaceResultsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="container mx-auto p-4 md:p-8"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-bebasNeue text-7xl text-text-white uppercase flex items-center justify-center">
          RACE <span className="text-accent-orange ml-4">HISTORY</span>
          <div className="ml-6 w-12 h-12 flex flex-wrap" style={{ animation: 'flagWave 2s infinite' }}>
            {[...Array(16)].map((_, i) => (
              <div key={i} className={`w-1/4 h-1/4 ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`}></div>
            ))}
          </div>
        </h1>
        <p className="font-dmSans text-xl text-text-muted mt-4">Every finish line you&apos;ve crossed.</p>
      </div>

      <SeasonSummaryStrip />

      <div className="grid grid-cols-1 gap-8 mb-12">
        {dummyRaces.map((race, index) => (
          <RaceHistoryCard key={race.id} race={race} index={index} />
        ))}
      </div>

      <div className="flex justify-center mb-12">
        <AddRaceResultButton onClick={() => setIsModalOpen(true)} />
      </div>

      <RaceBadgesSection />

      <AddRaceResultModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
};

export default RaceResultsPage;
