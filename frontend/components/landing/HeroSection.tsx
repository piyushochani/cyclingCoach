"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import DashboardPreview from "./DashboardPreview";
import { clearSignupStorage } from "./clearSignupStorage";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 lg:pt-40">
      <div className="landing-hero-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="landing-orb landing-orb-a pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full blur-[100px]" aria-hidden />
      <div className="landing-orb landing-orb-b pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full blur-[120px]" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B00]" />
            </span>
            AI coaching for serious cyclists
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-[family-name:var(--font-barlow-condensed)] text-[clamp(2.75rem,7vw,5.5rem)] font-bold uppercase leading-[0.92] tracking-tight text-white"
          >
            Train with precision.
            <span className="mt-1 block bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
              Race with confidence.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 md:text-lg"
          >
            CyclogenAI turns your rides, fatigue, recovery, and race goals into a continuously
            adapting training system — built for long-term performance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              onClick={clearSignupStorage}
              className="group inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(255,107,0,0.35)] transition hover:bg-[#ff7a1a] hover:shadow-[0_0_40px_rgba(255,107,0,0.45)]"
            >
              Start training free
              <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white"
            >
              See how it works
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {["53,000+ km analyzed", "Adaptive plans", "Strava sync"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-medium text-white/45"
              >
                {chip}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="mt-14 md:mt-20">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
