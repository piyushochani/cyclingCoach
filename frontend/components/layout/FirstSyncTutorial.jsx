"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Dashboard",
    desc: "Your training at a glance — weekly volume, recent rides, and a 35-day activity heatmap. All metrics update automatically after each sync.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Activities",
    desc: "Every ride logged with full metrics — distance, time, power, heart rate, elevation, and more. Filter, search, and review past performances.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "AI Analysis",
    desc: "Get daily, weekly, and monthly AI-powered reviews of your training. The AI coach understands your goals, workload, and progression.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Training Plans",
    desc: "Auto-generated weekly training plans based on your recent rides. Build next week's plan with one click and track it on the schedule card.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Sync & Updates",
    desc: "Your data syncs from Strava whenever you press the Refresh button in the profile menu. Dashboard, stats, and AI analysis reflect the latest synced data.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Best Efforts & Stats",
    desc: "Track your personal records across distances and durations. View seasonal trends, weekly mileage graphs, and year-over-year comparisons.",
  },
];

const FirstSyncTutorial = ({ onDismiss }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("cyclogenai_tutorial_shown") !== "true") {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("cyclogenai_tutorial_shown", "true");
    setShow(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#111318] p-6 md:p-8 shadow-2xl my-8"
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF5500]/10">
                <svg className="h-8 w-8 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="font-barlowCondensed text-3xl uppercase tracking-wide text-white">
                Welcome to <span className="text-[#FF5500]">CyclogenAI</span>
              </h1>
              <p className="mt-2 font-dmSans text-sm text-white/50 max-w-md mx-auto">
                Your data is synced. Here&apos;s how to get the most out of your training.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="rounded-xl border border-white/[0.06] bg-surface-cards p-4"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF5500]/10 text-[#FF5500]">
                    {f.icon}
                  </div>
                  <h3 className="font-barlowCondensed text-base uppercase tracking-wide text-white">
                    {f.title}
                  </h3>
                  <p className="mt-1 font-dmSans text-xs leading-relaxed text-white/40">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={dismiss}
                className="rounded-xl bg-[#FF5500] px-8 py-3 font-dmSans text-sm font-bold text-white transition hover:bg-[#e04a00]"
              >
                Got it — Let&apos;s Ride
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstSyncTutorial;
