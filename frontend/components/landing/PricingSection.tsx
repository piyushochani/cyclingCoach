"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PRICING_FEATURES } from "./landing-data";
import { clearSignupStorage } from "./clearSignupStorage";

export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B00]/80">Pricing</p>
          <h2 className="mt-3 font-[family-name:var(--font-barlow-condensed)] text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-5xl">
            One plan. Full access.
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto mt-14 max-w-md"
        >
          <div className="landing-glow absolute -inset-6 rounded-3xl opacity-50 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0c0c0f] p-8 md:p-10">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#FF6B00]/10 blur-2xl" aria-hidden />
            <p className="text-center">
              <span className="font-[family-name:var(--font-barlow-condensed)] text-5xl font-bold text-white">$12</span>
              <span className="text-xl text-white/40">/mo</span>
            </p>
            <p className="mt-1 text-center text-sm text-white/45">Billed monthly · Cancel anytime</p>

            <ul className="mt-8 space-y-3.5">
              {PRICING_FEATURES.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/65">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/15 text-[#FF6B00]">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              onClick={clearSignupStorage}
              className="mt-8 block w-full rounded-full bg-[#FF6B00] py-3.5 text-center text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,107,0,0.3)] transition hover:bg-[#ff7a1a]"
            >
              Start free trial
            </Link>
            <p className="mt-3 text-center text-xs text-white/35">14-day free trial · No credit card required</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
