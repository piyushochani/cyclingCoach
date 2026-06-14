// frontend/components/layout/NutritionPlanDrawer.jsx
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NutritionPlanDrawer = ({ isOpen, onClose, raceName = 'Selected Race' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="fixed top-0 right-0 h-full w-full md:w-96 bg-surface-cards z-50 shadow-xl flex flex-col pt-16" // pt-16 for navbar
        >
          {/* Header */}
          <div className="bg-elevation-highlight p-4 flex items-center justify-between">
            <h3 className="font-bebasNeue text-xl text-text-primary">Nutrition Plan: {raceName}</h3>
            <button onClick={onClose} className="text-text-secondary hover:text-accent-orange">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {/* Pre-Race Section */}
            <div>
              <h4 className="font-bebasNeue text-lg text-text-primary mb-3 border-b border-chain-link-grey pb-1">Pre-Race Strategy</h4>
              <ul className="list-disc list-inside space-y-2 font-dmSans text-text-secondary">
                <li>3 Days Out: Carb load with complex carbs (pasta, rice).</li>
                <li>Night Before: Light, easily digestible meal.</li>
                <li>Race Morning: Small, familiar breakfast 3 hours before start.</li>
              </ul>
            </div>

            {/* On-Bike Timeline */}
            <div>
              <h4 className="font-bebasNeue text-lg text-text-primary mb-3 border-b border-chain-link-grey pb-1">On-Bike Fuel Timeline</h4>
              <div className="overflow-x-hidden pb-2">
                <div className="flex items-center space-x-8">
                  {/* Example timeline points */}
                  {[
                    { dist: '0km', fuel: 'Water' },
                    { dist: '20km', fuel: 'Gel (80g carb)' },
                    { dist: '40km', fuel: 'Bottle (Carb Mix)' },
                    { dist: '60km', fuel: 'Bar (50g carb)' },
                    { dist: '80km', fuel: 'Gel (80g carb)' },
                    { dist: '100km', fuel: 'Water' },
                  ].map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-accent-orange flex items-center justify-center text-white mb-2">
                        {/* Fuel Icon Placeholder */}
                        {item.fuel.includes('Gel') && <span>🍬</span>}
                        {item.fuel.includes('Water') && <span>💧</span>}
                        {item.fuel.includes('Bottle') && <span>🍼</span>}
                        {item.fuel.includes('Bar') && <span>🍫</span>}
                      </div>
                      <p className="font-jetbrainsMono text-sm text-text-primary">{item.dist}</p>
                      <p className="font-dmSans text-xs text-text-secondary">{item.fuel}</p>
                    </div>
                  ))}
                </div>
                <div className="h-1 bg-chain-link-grey w-full mt-4"></div> {/* Timeline line */}
              </div>
            </div>

            {/* Hydration Section */}
            <div>
              <h4 className="font-bebasNeue text-lg text-text-primary mb-3 border-b border-chain-link-grey pb-1">Hydration</h4>
              <p className="font-dmSans text-text-secondary">
                Target 500-750ml fluid per hour, with electrolytes. Adjust based on temperature and effort.
              </p>
            </div>

            {/* Post-Race Recovery */}
            <div>
              <h4 className="font-bebasNeue text-lg text-text-primary mb-3 border-b border-chain-link-grey pb-1">Post-Race Recovery</h4>
              <p className="font-dmSans text-text-secondary">
                Within 30 mins: Protein + Carb shake. Continue hydration. Active recovery.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NutritionPlanDrawer;
