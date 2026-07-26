"use client";

import { motion } from "framer-motion";

const bars = [42, 68, 55, 82, 48, 71, 38, 88, 62, 75, 52, 90];

export default function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-4xl"
    >
      <div className="landing-glow absolute -inset-4 rounded-3xl opacity-60 blur-3xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0d0d10]/90 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl md:rounded-3xl">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 md:px-5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs font-medium text-white/35">cyclogenai.app/dashboard</span>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.2fr] md:gap-5 md:p-6">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">This week</p>
              <p className="mt-1 font-[family-name:var(--font-barlow-condensed)] text-3xl font-bold text-white">312 km</p>
              <p className="mt-1 text-xs text-emerald-400/90">+12% vs last week</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "FTP", value: "268 W" },
                { label: "Form", value: "+8" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">{m.label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{m.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[#FF6B00]/20 bg-[#FF6B00]/[0.06] p-4">
              <p className="text-xs font-medium text-[#FF6B00]">Tomorrow · Sweet spot</p>
              <p className="mt-1 text-sm text-white/80">3 × 12 min @ 88–92% FTP · 68 km planned</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-white/70">Training load</p>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] text-white/45">12 weeks</span>
            </div>
            <div className="flex h-32 items-end gap-1.5 md:h-36">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-[#FF6B00]/30 to-[#FF6B00]"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.04, ease: "easeOut" }}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
              {["Mon", "Wed", "Sat"].map((d, i) => (
                <div key={d} className="text-center">
                  <p className="text-[10px] text-white/35">{d}</p>
                  <p className="text-xs font-medium text-white/70">{["Rest", "Intervals", "Long ride"][i]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
