"use client";

import { motion } from "framer-motion";
import { STATS } from "./landing-data";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export default function StatsBar() {
  return (
    <section className="relative border-y border-white/[0.06] bg-[#08080a]/80 py-10 backdrop-blur-sm md:py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              className="text-center md:text-left"
            >
              <p className="font-[family-name:var(--font-barlow-condensed)] text-3xl font-bold tracking-tight text-white md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-white/40">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
