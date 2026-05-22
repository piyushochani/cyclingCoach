"use client";

import React from "react";
import { motion } from "framer-motion";

const featureCardData = [
  {
    title: "Smart Scheduling",
    description:
      "AI builds weekly plans around your fitness, fatigue, and race calendar, then adapts them in real time.",
    icon: (
      <svg className="h-11 w-11 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Race Intelligence",
    description:
      "Input your A-race and CycloAI reverse-engineers your season with sharper pacing and smarter preparation.",
    icon: (
      <svg className="h-11 w-11 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 4l6 6-8 8H5v-6l8-8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M14 5l5 5" />
      </svg>
    ),
  },
  {
    title: "Performance Coins",
    description:
      "Earn rewards for every hard effort, milestone, and breakthrough, turning consistency into visible momentum.",
    icon: (
      <svg className="h-11 w-11 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.5 14.5c.7.9 1.8 1.4 3.1 1.4 1.6 0 2.9-.8 2.9-2 0-1.3-1.1-1.8-3.1-2.3-1.7-.5-2.8-.9-2.8-2.2 0-1.2 1.1-2 2.7-2 1.1 0 2.1.4 2.8 1.1M12 6.5v11" />
      </svg>
    ),
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" },
  }),
};

const FeatureCards = () => {
  return (
    <section className="relative z-20 mx-auto -mt-12 w-full max-w-7xl px-5 pb-20 md:-mt-16 md:px-8 md:pb-24">
      <div className="grid gap-6 md:grid-cols-3 md:gap-8">
        {featureCardData.map((card, index) => (
          <motion.article
            key={card.title}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            className="rounded-2xl border border-white/10 border-t-[3px] border-t-accent-orange bg-surface-cards/88 p-8 md:p-9 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="mb-5">{card.icon}</div>
            <h3 className="font-barlowCondensed text-3xl uppercase tracking-[0.03em] text-white">
              {card.title}
            </h3>
            <p className="mt-4 font-dmSans text-base leading-7 text-text-secondary">
              {card.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;