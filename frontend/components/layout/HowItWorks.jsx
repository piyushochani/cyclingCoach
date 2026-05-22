// frontend/components/layout/HowItWorks.jsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';

const stepsData = [
  {
    number: 1,
    title: "Connect Your Data",
    description: "Securely link your favorite fitness trackers like Strava. We pull your activity data to understand your performance.",
    icon: (
      <svg className="w-16 h-16 text-accent-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.808a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101v-.001z"></path>
      </svg>
    ),
  },
  {
    number: 2,
    title: "AI Analysis & Plan",
    description: "Our AI analyzes your strengths, weaknesses, and goals to generate a personalized, adaptive training plan.",
    icon: (
      <svg className="w-16 h-16 text-accent-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 17h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM12 9v6m-3-3h6"></path>
      </svg>
    ),
  },
  {
    number: 3,
    title: "Ride & Progress",
    description: "Execute your plan, track your progress, and get real-time feedback. Our AI adapts as you grow stronger.",
    icon: (
      <svg className="w-16 h-16 text-accent-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m2-7V5a2 2 0 012-2h2.5a2 2 0 012 2v7m-4 5h6m-6 0h-2M9 14h6m-6 4h6"></path>
      </svg>
    ),
  },
];

const HowItWorks = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const chainVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 2, ease: "easeInOut" } },
  };

  return (
    <section className="bg-bg-dark py-20 px-8 md:px-16 relative overflow-hidden">
      {/* Bicycle wheel SVG watermark */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] text-surface-cards opacity-10"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="1" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="1" />
        {/* Spokes - simplified */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="50"
            x2={50 + 45 * Math.cos(i * Math.PI / 4)}
            y2={50 + 45 * Math.sin(i * Math.PI / 4)}
            stroke="currentColor"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      <motion.div
        className="relative z-10 text-center mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <motion.h2 className="font-bebasNeue text-5xl text-text-primary uppercase mb-4" variants={itemVariants}>
          How It <span className="text-accent-orange">Works</span>
        </motion.h2>
        <motion.p className="font-dmSans text-xl text-text-secondary max-w-2xl mx-auto" variants={itemVariants}>
          Our platform simplifies advanced training into three easy steps, guided by cutting-edge AI.
        </motion.p>
      </motion.div>

      <div className="relative z-10 flex flex-col md:flex-row justify-center items-center md:items-start gap-12">
        {/* Chain-link connector */}
        <motion.svg
          className="absolute hidden md:block top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-8"
          viewBox="0 0 800 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d="M 0 25 L 250 25 C 275 25 275 5 300 5 L 500 5 C 525 5 525 25 550 25 L 800 25"
            stroke="url(#chainGradient)"
            strokeWidth="4"
            strokeDasharray="20 10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.8 }}
            variants={chainVariants}
          />
          <defs>
            <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-chain-link-grey)" />
              <stop offset="50%" stopColor="var(--color-accent-orange)" />
              <stop offset="100%" stopColor="var(--color-chain-link-grey)" />
            </linearGradient>
          </defs>
        </motion.svg>


        {stepsData.map((step, index) => (
          <motion.div
            key={step.number}
            className="flex flex-col items-center text-center max-w-xs p-6 bg-surface-cards/70 backdrop-blur-sm rounded-lg shadow-lg border-t-4 border-accent-orange"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            style={{ position: 'relative' }} // Needed for proper z-index and positioning of line
          >
            <div className="w-16 h-16 rounded-full bg-accent-orange flex items-center justify-center mb-4 text-text-primary font-bebasNeue text-3xl">
              {step.number}
            </div>
            {step.icon}
            <h3 className="font-bebasNeue text-3xl text-text-primary mb-3">
              {step.title}
            </h3>
            <p className="font-dmSans text-text-secondary text-lg">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
