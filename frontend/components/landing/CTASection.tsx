"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { clearSignupStorage } from "./clearSignupStorage";

export default function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#12121a] via-[#0c0c0f] to-[#080808] px-8 py-14 text-center md:px-16 md:py-20"
        >
          <div className="landing-orb landing-orb-a pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full opacity-40 blur-[80px]" aria-hidden />
          <div className="landing-orb landing-orb-b pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full opacity-30 blur-[80px]" aria-hidden />

          <p className="relative text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B00]/80">
            Ready to perform?
          </p>
          <h2 className="relative mt-4 font-[family-name:var(--font-barlow-condensed)] text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white md:text-5xl lg:text-6xl">
            Your best season starts now
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/50 md:text-base">
            Join cyclists who train with purpose, recover with confidence, and race with precision.
          </p>
          <Link
            href="/signup"
            onClick={clearSignupStorage}
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-9 py-4 text-sm font-semibold text-white shadow-[0_0_40px_rgba(255,107,0,0.35)] transition hover:bg-[#ff7a1a]"
          >
            Start free — no credit card
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6" />
            </svg>
          </Link>
          <p className="relative mt-3 text-xs text-white/35">14-day free trial · Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
}
