"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ScheduleRaceButton from '../../../components/layout/ScheduleRaceButton';
import ScheduleRaceModal from '../../../components/layout/ScheduleRaceModal';
import UpcomingRacesTable from '../../../components/layout/UpcomingRacesTable';
import NutritionPlanDrawer from '../../../components/layout/NutritionPlanDrawer';
import AIPeriodization from '../../../components/layout/AIPeriodization';

export const TypewriterText = ({ text, delay = 60 }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}</span>;
};

const AITrainingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto p-4 md:p-8"
    >
      <div className="text-center mb-16">
        <h1 className="font-bebasNeue text-7xl text-text-white uppercase flex items-center justify-center">
          AI TRAINING <span className="text-accent-orange mx-4">COMMAND</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-1 h-12 bg-accent-orange"
          />
        </h1>
        <p className="font-dmSans text-xl text-text-muted mt-4 h-8">
          <TypewriterText text="Your AI coach is analyzing your data..." />
        </p>
      </div>

      <div className="flex flex-col items-center mb-16">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border-2 border-accent-orange opacity-0 animate-ping" />
          <div className="absolute inset-0 rounded-full border-2 border-accent-orange opacity-0 animate-ping delay-700" />
          <ScheduleRaceButton onClick={() => setIsModalOpen(true)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <div className="lg:col-span-2">
          <UpcomingRacesTable />
        </div>
        <div className="bg-surface-cards border border-border-subtle rounded-xl p-6">
          <h2 className="font-bebasNeue text-2xl text-text-white mb-4">Quick Links</h2>
          <button onClick={() => setIsDrawerOpen(true)} className="w-full py-3 bg-accent-orange text-white font-bebasNeue rounded-md">
            View Nutrition Plan
          </button>
        </div>
      </div>

      <AIPeriodization />

      <ScheduleRaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <NutritionPlanDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </motion.div>
  );
};

export default AITrainingPage;
