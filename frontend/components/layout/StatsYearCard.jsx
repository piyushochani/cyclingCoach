"use client";

import React from "react";
import { motion } from "framer-motion";

const StatsYearCard = ({ stats, year = "2026" }) => {
  if (!stats) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6 md:p-7"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-dmSans text-[10px] uppercase tracking-[0.16em] text-white/35">
            Statistics
          </p>
          <h2 className="mt-1 font-dmSans text-3xl font-semibold tracking-[-0.02em] text-white">
            Year Overview
          </h2>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-dmSans text-xs tracking-[0.1em] text-white/50">
          {year}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 * index, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.025] p-5"
          >
            <div className="absolute left-[20%] right-[20%] top-0 h-px bg-gradient-to-r from-transparent via-[#FF7A1A]/40 to-transparent" />

            <div className="mb-3 flex items-center justify-between">
              <p className="font-dmSans text-[10px] uppercase tracking-[0.14em] text-white/38">
                {item.label}
              </p>
              <span className="text-sm text-[#FF7A1A]/70">
                {item.accent}
              </span>
            </div>

            <div className="flex items-end gap-2">
              <span className="font-dmSans text-4xl font-medium leading-none text-white">
                {item.value}
              </span>
              {item.unit ? (
                <span className="pb-1 font-dmSans text-xs tracking-[0.1em] text-white/45">
                  {item.unit}
                </span>
              ) : null}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default StatsYearCard;