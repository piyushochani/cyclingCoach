"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NutritionPlanDrawer = ({ isOpen, onClose, race, nutritionPlan }) => {
  const raceName = race?.name || 'Selected Race';
  const schedule = nutritionPlan?.schedule || [];
  const hasPlan = nutritionPlan && (schedule.length > 0 || nutritionPlan.preRaceMeal || nutritionPlan.duringRace);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="fixed top-0 right-0 h-full w-full md:w-96 bg-surface-cards z-50 shadow-xl flex flex-col pt-16"
        >
          <div className="bg-elevation-highlight p-4 flex items-center justify-between">
            <h3 className="font-bebasNeue text-xl text-text-primary">Nutrition Plan: {raceName}</h3>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-accent-orange">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {!hasPlan ? (
              <div className="text-center py-10">
                <p className="font-dmSans text-sm text-text-secondary">No nutrition plan generated yet.</p>
                <p className="font-dmSans text-xs text-text-muted mt-1">
                  Plans are created when you schedule a race and generate race-day preparation.
                </p>
              </div>
            ) : (
              <>
                {nutritionPlan.preRaceMeal && (
                  <div>
                    <h4 className="font-bebasNeue text-lg text-text-primary mb-3 border-b border-chain-link-grey pb-1">Pre-Race Strategy</h4>
                    <p className="font-dmSans text-text-secondary whitespace-pre-wrap">{nutritionPlan.preRaceMeal}</p>
                  </div>
                )}

                {schedule.length > 0 && (
                  <div>
                    <h4 className="font-bebasNeue text-lg text-text-primary mb-3 border-b border-chain-link-grey pb-1">On-Bike Fuel Timeline</h4>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex items-center space-x-8">
                        {schedule.map((item, index) => (
                          <div key={index} className="flex flex-col items-center min-w-[72px]">
                            <div className="w-10 h-10 rounded-full bg-accent-orange flex items-center justify-center text-white mb-2 text-lg">
                              {item.what?.toLowerCase().includes('gel') ? '🍬'
                                : item.what?.toLowerCase().includes('water') ? '💧'
                                : item.what?.toLowerCase().includes('bar') ? '🍫'
                                : '🍼'}
                            </div>
                            <p className="font-jetbrainsMono text-sm text-text-primary">{item.timing || '—'}</p>
                            <p className="font-dmSans text-xs text-text-secondary text-center">{item.what || item.amount || '—'}</p>
                          </div>
                        ))}
                      </div>
                      <div className="h-1 bg-chain-link-grey w-full mt-4" />
                    </div>
                  </div>
                )}

                {nutritionPlan.hydrationStrategy && (
                  <div>
                    <h4 className="font-bebasNeue text-lg text-text-primary mb-3 border-b border-chain-link-grey pb-1">Hydration</h4>
                    <p className="font-dmSans text-text-secondary whitespace-pre-wrap">{nutritionPlan.hydrationStrategy}</p>
                  </div>
                )}

                {(nutritionPlan.duringRace || nutritionPlan.postRace) && (
                  <div>
                    <h4 className="font-bebasNeue text-lg text-text-primary mb-3 border-b border-chain-link-grey pb-1">During & Recovery</h4>
                    {nutritionPlan.duringRace && (
                      <p className="font-dmSans text-text-secondary mb-2 whitespace-pre-wrap">{nutritionPlan.duringRace}</p>
                    )}
                    {nutritionPlan.postRace && (
                      <p className="font-dmSans text-text-secondary whitespace-pre-wrap">{nutritionPlan.postRace}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NutritionPlanDrawer;
