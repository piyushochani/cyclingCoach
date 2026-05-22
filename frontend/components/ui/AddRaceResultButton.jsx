// frontend/components/ui/AddRaceResultButton.jsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';

const AddRaceResultButton = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-accent-orange text-white shadow-lg
                 flex items-center justify-center text-3xl font-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-orange"
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
    >
      +
    </motion.button>
  );
};

export default AddRaceResultButton;
