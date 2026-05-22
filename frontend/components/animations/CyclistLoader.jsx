// frontend/components/animations/CyclistLoader.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CyclistLoader = ({ isLoading, progress, message }) => {
  if (!isLoading) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark/80 backdrop-blur-md"
        >
          <div className="text-center text-text-primary">
            {/* Cyclist Animation Placeholder */}
            <div className="relative w-48 h-24 mx-auto mb-4">
              {/* Basic Cyclist SVG Placeholder */}
              <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Body */}
                <circle cx="100" cy="50" r="10" fill="white" />
                {/* Wheels */}
                <circle cx="60" cy="70" r="15" fill="white" />
                <circle cx="140" cy="70" r="15" fill="white" />
              </svg>
              {/* Road Dashed Line Placeholder */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-chain-link-grey">
                <div className="absolute inset-0 flex overflow-hidden">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <span
                      key={i}
                      className="block h-full w-4 bg-white mx-1"
                      style={{
                        transform: `translateX(-${(progress % 1) * 25}px)`, // Simple animation
                      }}
                    ></span>
                  ))}
                </div>
              </div>
            </div>

            <p className="font-bebasNeue text-4xl text-accent-orange mb-2">
              {Math.round(progress * 100)}%
            </p>
            <p className="font-dmSans text-lg text-text-secondary">
              {message || "LOADING DATA..."}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CyclistLoader;
