// frontend/components/layout/LandingHero.jsx
"use client"; // This is a Client Component

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const LandingHero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative h-screen flex items-center">
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534787238916-9ba6764efd4f"
          alt="Cyclist on road"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ backgroundAttachment: 'fixed', transform: 'translateZ(0)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-bg-dark/50 z-10"></div>
      </div>

      {/* Content for the left half */}
      <motion.div
        className="relative z-20 w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.span
          className="font-dmSans text-sm uppercase text-accent-orange bg-surface-cards px-3 py-1 rounded-full w-fit mb-4"
          variants={itemVariants}
        >
          AI-POWERED COACHING
        </motion.span>

        <motion.h1
          className="font-bebasNeue text-7xl md:text-8xl leading-tight text-text-primary mb-6"
          variants={itemVariants}
        >
          TRAIN <span className="text-accent-orange">SMARTER.</span> RIDE{' '}
          <span className="text-accent-orange">FASTER.</span>
        </motion.h1>

        <motion.p
          className="font-dmSans text-xl text-text-secondary mb-8 max-w-lg"
          variants={itemVariants}
        >
          Unlock your full potential with personalized AI-driven training plans,
          real-time analytics, and expert guidance.
        </motion.p>

        <motion.div className="flex space-x-4 mb-10" variants={itemVariants}>
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#E55C00' }}
              whileTap={{ scale: 0.95 }}
              className="skew-x-[-15deg] px-8 py-4 bg-accent-orange text-white font-dmSans text-xl relative group overflow-hidden shadow-lg"
            >
              <span className="block skew-x-[15deg] group-hover:skew-x-0 transition-transform duration-300">
                START YOUR JOURNEY →
              </span>
            </motion.button>
          </Link>
          <Link href="/dashboard"> {/* Assuming a public dashboard or demo */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-text-primary text-text-primary rounded-md font-dmSans text-xl"
            >
              LEARN MORE
            </motion.button>
          </Link>
        </motion.div>

        {/* Stat Pills - Placeholder for now, to be implemented as a separate component */}
        <motion.div className="flex space-x-4" variants={itemVariants}>
          <span className="font-jetbrainsMono text-sm text-text-secondary bg-surface-cards px-3 py-1 rounded-full">
            +1000 Athletes
          </span>
          <span className="font-jetbrainsMono text-sm text-text-secondary bg-surface-cards px-3 py-1 rounded-full">
            AI-Optimized
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default LandingHero;
