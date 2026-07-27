"use client";

import { motion } from "framer-motion";
import { STEPS } from "./landing-data";

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-white/[0.06] bg-[#060608] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B00]/80">The system</p>
          <h2 className="mt-3 font-[family-name:var(--font-barlow-condensed)] text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-5xl">
            Three steps to faster
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/50 md:text-base">
            A clean loop designed for athletes who want structure without complexity.
          </p>
        </div>

        <div className="relative mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
          <div className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-12 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:block" aria-hidden />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="relative rounded-2xl border border-white/[0.07] bg-[#0a0a0c] p-6 md:p-8"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 font-[family-name:var(--font-barlow-condensed)] text-lg font-bold text-[#FF6B00]">
                {step.num}
              </div>
              <h3 className="text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
