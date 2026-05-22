// frontend/components/layout/ScheduleRaceButton.jsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ScheduleRaceButton = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative flex items-center justify-center p-0.5 overflow-hidden text-lg font-bebasNeue text-white bg-accent-orange
                 skew-x-[-15deg] group transition-all duration-300 ease-out shadow-xl
                 w-full max-w-sm mx-auto h-20" // Large size
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Pulsing concentric rings background */}
      <motion.span
        className="absolute inset-0 bg-accent-orange rounded-lg"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut",
        }}
      ></motion.span>
      <motion.span
        className="absolute inset-0 bg-accent-orange rounded-lg"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut",
          delay: 0.5,
        }}
      ></motion.span>
      
      {/* Content */}
      <span className="relative z-10 flex items-center space-x-3 bg-bg-dark px-10 py-3 rounded-lg skew-x-[15deg] h-full w-full justify-center">
        {/* Plus Icon */}
        <svg
          className="w-8 h-8 text-accent-orange"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <span className="text-text-primary uppercase tracking-wide">SCHEDULE RACE TARGET</span>
      </span>
    </motion.button>
  );
};

export default ScheduleRaceButton;
