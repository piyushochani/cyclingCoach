"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS } from "./landing-data";

export default function TestimonialsSection() {
  return (
    <section id="reviews" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B00]/80">Real athletes</p>
          <h2 className="mt-3 font-[family-name:var(--font-barlow-condensed)] text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-5xl">
            Results that speak
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col rounded-2xl border border-white/[0.07] bg-[#0c0c0f] p-6"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, si) => (
                  <svg key={si} className="h-3.5 w-3.5 text-[#FF6B00]/70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-white/65">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B00]/15 text-xs font-bold text-[#FF6B00]">
                  {t.avatar}
                </div>
                <div>
                  <cite className="not-italic text-sm font-semibold text-white">{t.name}</cite>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
