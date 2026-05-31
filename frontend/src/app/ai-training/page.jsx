"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ScheduleRaceButton from '../../../components/layout/ScheduleRaceButton';
import ScheduleRaceModal from '../../../components/layout/ScheduleRaceModal';
import UpcomingRacesTable from '../../../components/layout/UpcomingRacesTable';
import NutritionPlanDrawer from '../../../components/layout/NutritionPlanDrawer';
import AIPeriodization from '../../../components/layout/AIPeriodization';
import { TypewriterText } from '../../../components/ui/TypewriterText';

const AITrainingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-10 pt-[44px] md:px-6 md:pt-[52px] xl:px-8"
      >
        <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
              Intelligence Hub
            </p>
            <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
              AI Training <span className="text-[#FF5500]">Command</span>
            </h1>
            <div className="mt-4 flex items-center gap-2">
               <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="h-4 w-1 bg-[#FF5500]"
              />
              <p className="font-dmSans text-sm text-white/50 md:text-[15px]">
                <TypewriterText text="Your AI coach is analyzing your performance data..." />
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
             <div className="relative">
              <div className="absolute inset-0 rounded-full border-2 border-[#FF5500] opacity-0 animate-ping" />
              <ScheduleRaceButton onClick={() => setIsModalOpen(true)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <UpcomingRacesTable />
            <AIPeriodization />
          </div>
          
          <div className="space-y-6">
            <div className="bg-[#111318] border border-white/5 rounded-2xl p-6">
              <h2 className="font-bebasNeue text-2xl text-white mb-4 tracking-wide">Command Center</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => setIsDrawerOpen(true)} 
                  className="w-full py-4 bg-[#FF5500] hover:bg-[#FF5500] text-white font-bebasNeue text-lg rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(255,85,0,0.1)] hover:shadow-[0_0_25px_rgba(255,85,0,0.2)]"
                >
                  View Nutrition Plan
                </button>
                <button 
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bebasNeue text-lg rounded-xl border border-white/10 transition-all duration-200"
                >
                  Season Planner
                </button>
                <button 
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bebasNeue text-lg rounded-xl border border-white/10 transition-all duration-200"
                >
                  Lab Results
                </button>
              </div>
            </div>

            <div className="bg-[#111318] border border-white/5 rounded-2xl p-6">
              <h2 className="font-bebasNeue text-2xl text-white mb-4 tracking-wide">Coach Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40 font-dmSans">Analysis Depth</span>
                  <span className="text-sm text-[#FF5500] font-jetbrainsMono">MAXIMUM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40 font-dmSans">Context Window</span>
                  <span className="text-sm text-white font-jetbrainsMono">30 DAYS</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-right from-[#FF5500] to-[#FF8C00]"
                  />
                </div>
                <p className="text-[11px] text-white/30 font-dmSans leading-relaxed">
                  The AI is currently correlating your recent heart rate variability with sleep quality to adjust tomorrow's intervals.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ScheduleRaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <NutritionPlanDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      </motion.main>
    </div>
  );
};

export default AITrainingPage;
