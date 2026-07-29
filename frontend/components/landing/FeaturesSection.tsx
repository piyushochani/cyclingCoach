"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { FEATURES } from "./landing-data";

const ICONS: Record<string, ReactNode> = {
  calendar: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  ),
  target: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 3a3 3 0 100 6 3 3 0 000-6z" />
  ),
  chart: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 19h16M7 16l3-4 3 2 5-7" />
  ),
  sync: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h5M20 20v-5h-5M5 19A9 9 0 0119 5" />
  ),
  chat: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 21l1.8-4.2A8.8 8.8 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  ),
  trend: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 17l6-6 4 4 8-10M14 5h7v7" />
  ),
};

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B00]/80">{eyebrow}</p>
      <h2 className="mt-3 font-[family-name:var(--font-barlow-condensed)] text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-sm leading-relaxed text-white/50 md:text-base">{subtitle}</p>
      )}
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
        >
          <SectionHeader
            eyebrow="Platform"
            title="Every edge, engineered"
            subtitle="From adaptive planning to race-day readiness — one system for your entire season."
          />
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {FEATURES.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-white/[0.07] bg-[#0c0c0f]/80 p-6 backdrop-blur-sm transition-colors hover:border-white/[0.14] hover:bg-[#101014]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#FF6B00]/20 bg-[#FF6B00]/10 text-[#FF6B00] transition group-hover:border-[#FF6B00]/40 group-hover:bg-[#FF6B00]/15">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {ICONS[feature.icon]}
                </svg>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                {feature.tag}
              </p>
              <h3 className="mt-2 text-xl font-semibold leading-snug text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{feature.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
