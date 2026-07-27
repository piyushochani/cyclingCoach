"use client";

import { motion } from "framer-motion";
import { ABOUT_STATS } from "./landing-data";

export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 border-t border-white/[0.06] bg-[#060608] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B00]/80">About</p>
            <h2 className="mt-3 font-[family-name:var(--font-barlow-condensed)] text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-5xl">
              Built for athletes
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/55 md:text-base">
              CyclogenAI was founded by cyclists tired of one-size-fits-all training plans. We combine
              sports science with adaptive AI so every rider gets a plan that evolves as they do —
              from base miles to race day.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            {ABOUT_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/[0.07] bg-[#0a0a0c] p-5 text-center"
              >
                <p className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-bold text-white md:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
