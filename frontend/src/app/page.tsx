"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

// ─── DATA ──────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Features", "How It Works", "Pricing", "About"];

const STATS = [
  { value: "685+", label: "Activities Logged" },
  { value: "53K+", label: "KM Analyzed" },
  { value: "12", label: "Race Podiums" },
  { value: "4.9", label: "Avg. Rating" },
];

const FEATURES = [
  {
    tag: "01 — Planning",
    title: "Adaptive\nWeekly Plans",
    body: "AI builds and rebuilds your training week around fitness, fatigue, and race calendar in real time — no manual tweaking required.",
    accent: "#C8FF3E",   // electric lime
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  },
  {
    tag: "02 — Intelligence",
    title: "Race-Day\nReadiness",
    body: "Input a target event and CycloAI maps out the precise path to peak form — pacing, taper, and final-week sharpening included.",
    accent: "#38E8FF",   // electric cyan
    icon: "M13 4l6 6-8 8H5v-6l8-8zM14 5l5 5",
  },
  {
    tag: "03 — Motivation",
    title: "Progress\nEconomy",
    body: "Streaks, milestones, and visual momentum across every training block. Consistency becomes its own reward.",
    accent: "#FF5EE8",   // hot magenta
    icon: "M9.5 14.5c.7.9 1.8 1.4 3.1 1.4 1.6 0 2.9-.8 2.9-2 0-1.3-1.1-1.8-3.1-2.3-1.7-.5-2.8-.9-2.8-2.2 0-1.2 1.1-2 2.7-2 1.1 0 2.1.4 2.8 1.1M12 6.5v11",
    extraPath: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Connect your rides",
    body: "Import your Strava, Wahoo, or Garmin history. CycloAI reads power, HR, cadence, and recovery signals instantly.",
    /* IMAGE PLACEHOLDER */ img: null,   // ← image here: a cyclist syncing a Garmin device
  },
  {
    num: "02",
    title: "AI builds your plan",
    body: "Training load, periodisation, and race goals merge into a personalized structure that evolves week by week.",
    /* IMAGE PLACEHOLDER */ img: null,   // ← image here: a polished training plan UI / calendar grid
  },
  {
    num: "03",
    title: "Ride, refine, repeat",
    body: "Every ride makes the model smarter. CycloAI sharpens pacing targets, recovery windows, and next steps automatically.",
    /* IMAGE PLACEHOLDER */ img: null,   // ← image here: cyclist climbing a mountain pass at sunrise
  },
];

const TESTIMONIALS = [
  {
    quote: "My FTP jumped 18 watts in 10 weeks. The adaptive plan just keeps working.",
    name: "Luca M.",
    role: "Amateur racer, Cat 3",
    avatar: "LM",
  },
  {
    quote: "Finally a training app that understands I'm not always fresh. It backs off when I need it.",
    name: "Sara K.",
    role: "Century rider",
    avatar: "SK",
  },
  {
    quote: "Won my first podium at a regional road race. CycloAI had me perfectly peaked.",
    name: "James R.",
    role: "Masters cyclist",
    avatar: "JR",
  },
];

// ─── UTILS ──────────────────────────────────────────────────────────────────

const WheelSVG = ({ className = "", style = {} }) => (
  <svg className={className} style={style} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="5" />
    <circle cx="60" cy="60" r="10" stroke="currentColor" strokeWidth="5" />
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      return (
        <line
          key={i}
          x1={60 + 10 * Math.cos(angle)}
          y1={60 + 10 * Math.sin(angle)}
          x2={60 + 54 * Math.cos(angle)}
          y2={60 + 54 * Math.sin(angle)}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
    })}
  </svg>
);

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Navbar({ scrolled }: { scrolled: boolean }) {
  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#060709]/80 backdrop-blur-2xl border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            className="text-[#C8FF3E]"
          >
            <WheelSVG className="h-8 w-8" />
          </motion.div>
          <div className="leading-none">
            <p
              className="text-[1.45rem] font-black uppercase tracking-[0.12em] text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              CycloAI
            </p>
          </div>
        </Link>

        {/* Nav Links — desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="font-medium text-sm tracking-wide text-white/50 transition hover:text-white"
            >
              {l}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="hidden rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white md:block">
              Log In
            </button>
          </Link>
          <Link href="/signup">
            <button
              className="rounded-full px-5 py-2 text-sm font-bold text-black transition hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: "#C8FF3E" }}
            >
              Start Free →
            </button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-start justify-end overflow-hidden pb-24 md:pb-32">
      {/* ── Full-bleed hero image ── */}
      {/* IMAGE HERE: Replace the div below with an <img> tag.
          Ideal: dramatic shot of a cyclist on a mountain switchback or velodrome,
          slightly cool-toned. Aspect fills the full viewport height.
          Example: <img src="/hero.jpg" alt="Cyclist climbing mountain road" className="absolute inset-0 h-full w-full object-cover object-center" /> */}
      <div className="absolute inset-0 bg-[#090B0E]">
        {/* Placeholder gradient until real image is added */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_40%,rgba(56,232,255,0.08),transparent),radial-gradient(ellipse_60%_80%_at_80%_60%,rgba(200,255,62,0.04),transparent)]" />
        {/* Diagonal stripe texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Dark-to-left gradient overlay (keeps text readable even with real photo) */}
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(6,7,9,0.97)_0%,rgba(6,7,9,0.8)_42%,rgba(6,7,9,0.38)_70%,rgba(6,7,9,0.55)_100%)]" />

      {/* Accent orbs */}
      <div className="pointer-events-none absolute right-[12%] top-[18%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(200,255,62,0.07),transparent_70%)]" />
      <div className="pointer-events-none absolute right-[30%] top-[30%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(56,232,255,0.06),transparent_70%)]" />

      {/* Spinning wheel — large decorative */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute right-[8%] top-1/2 -translate-y-1/2 text-white/[0.04] md:right-[14%]"
      >
        <WheelSVG className="h-[480px] w-[480px] md:h-[600px] md:w-[600px]" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {/* Eyebrow pill */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border border-[#C8FF3E]/20 bg-[#C8FF3E]/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: "#C8FF3E" }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C8FF3E]" />
              AI-Powered Cycling Coach
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-4xl uppercase leading-[0.88] tracking-tight text-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(4rem, 10vw, 9rem)",
              fontWeight: 800,
            }}
          >
            Train smarter.{" "}
            <span
              className="italic"
              style={{
                WebkitTextStroke: "2px #C8FF3E",
                color: "transparent",
              }}
            >
              Race harder.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-lg text-base leading-7 text-white/55 md:text-lg"
          >
            CycloAI turns your rides, fatigue, recovery, and race goals into a
            continuously adapting training system built for long-term performance.
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <Link href="/signup">
              <button
                className="group flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-black transition hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "#C8FF3E" }}
              >
                Start Training Free
                <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-full border border-white/15 px-7 py-4 text-base font-medium text-white/70 backdrop-blur-sm transition hover:border-white/30 hover:text-white"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Trust chips */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            {["53,000+ km analyzed", "Adaptive plans", "Race-day precision"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/50"
              >
                {chip}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#060709] to-transparent" />
    </section>
  );
}

function StatsBar() {
  return (
    <section className="border-y border-white/[0.06] bg-[#060709]">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center"
            >
              <p
                className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#C8FF3E" }}
              >
                {s.value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#060709] px-6 py-24 md:px-10 md:py-32">
      {/* Section label */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">
              What we offer
            </p>
            <h2
              className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Every edge,<br />
              <span style={{ WebkitTextStroke: "2px #38E8FF", color: "transparent" }}>
                engineered.
              </span>
            </h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.tag}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0C0E12] p-8 transition hover:border-white/15"
            >
              {/* Accent glow on hover */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-3xl"
                style={{
                  background: `radial-gradient(circle at 0% 0%, ${f.accent}12 0%, transparent 60%)`,
                }}
              />

              {/* Tag */}
              <p
                className="mb-5 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: f.accent }}
              >
                {f.tag}
              </p>

              {/* Icon */}
              <div
                className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border"
                style={{ borderColor: `${f.accent}30`, background: `${f.accent}0D` }}
              >
                <svg className="h-7 w-7" fill="none" stroke={f.accent} viewBox="0 0 24 24">
                  {f.extraPath && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d={f.extraPath} />}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d={f.icon} />
                </svg>
              </div>

              {/* Divider */}
              <div className="mb-4 h-px w-12" style={{ background: f.accent }} />

              {/* Title */}
              <h3
                className="text-3xl font-black uppercase leading-tight tracking-tight text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {f.title.split("\n").map((line, j) => (
                  <React.Fragment key={j}>
                    {line}
                    {j < f.title.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/45">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-[#060709] px-6 py-24 md:px-10 md:py-32"
    >
      {/* Background accent */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">
            The system
          </p>
          <h2
            className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Three steps to{" "}
            <span style={{ color: "#C8FF3E" }}>faster.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/40">
            A clean loop designed for athletes who want structure without complexity.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-8 md:grid-cols-3 md:gap-6">
          {/* Connector line (desktop) */}
          <div className="pointer-events-none absolute left-0 right-0 top-[120px] hidden border-t border-dashed border-white/[0.08] md:block" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col"
            >
              {/* Step number badge */}
              <div className="relative z-10 mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full border border-[#C8FF3E]/20 bg-[#0C0E12]">
                <span
                  className="text-3xl font-black text-[#C8FF3E]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {step.num}
                </span>
              </div>

              {/* Image placeholder card */}
              {/* IMAGE HERE: Replace <div> below with <img src="..." />
                  Step 01: cyclist syncing with device / Garmin watch closeup
                  Step 02: clean UI training calendar / weekly plan view
                  Step 03: cyclist at sunrise climbing, rear silhouette shot */}
              <div className="mb-5 h-48 w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0C0E12]">
                <div
                  className="flex h-full w-full items-center justify-center text-xs font-medium tracking-widest text-white/20 uppercase"
                >
                  ← Image here (step {i + 1})
                </div>
              </div>

              <h3
                className="text-2xl font-black uppercase text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/40">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="relative bg-[#060709] px-6 py-24 md:px-10 md:py-32">
      {/* Large quote mark */}
      <div
        className="pointer-events-none absolute left-8 top-16 select-none text-[18rem] font-black leading-none text-white/[0.02]"
        aria-hidden
      >
        "
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">
            Real athletes
          </p>
          <h2
            className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-6xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Results that<br />
            <span style={{ color: "#FF5EE8" }}>speak for themselves.</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="rounded-3xl border border-white/[0.07] bg-[#0C0E12] p-8"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, si) => (
                  <svg key={si} className="h-4 w-4" fill="#C8FF3E" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              <p className="text-base leading-7 text-white/65">"{t.quote}"</p>

              <div className="mt-6 flex items-center gap-3">
                {/* Avatar */}
                {/* IMAGE HERE: Replace <div> with <img src={t.avatarUrl} className="h-10 w-10 rounded-full object-cover" />
                    Use real athlete headshots or abstract avatar images */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#161A20] text-xs font-bold text-white/60">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/35">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#060709] px-6 pb-24 pt-12 md:px-10 md:pb-32">
      {/* Decorative wheel */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute -right-32 -top-32 text-[#C8FF3E]/[0.04]"
        aria-hidden
      >
        <WheelSVG className="h-[500px] w-[500px]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-[#C8FF3E]/15 bg-[#0C0E12] p-10 text-center md:p-16"
      >
        {/* Inner glow */}
        <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,62,0.06),transparent_60%)]" />

        {/* IMAGE HERE: Optional background image for CTA card
            Suggestion: abstract overhead cycling shot or velodrome aerial */}

        <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: "#C8FF3E" }}>
          Ready to perform?
        </p>
        <h2
          className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-tight text-white md:text-7xl"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Your best season
          <br />
          starts now.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-white/45">
          Join cyclists who use CycloAI to train with purpose, recover with confidence, and race with precision.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <button
              className="group flex items-center gap-2 rounded-full px-9 py-4 text-base font-bold text-black transition hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: "#C8FF3E" }}
            >
              Start Free — No Credit Card
              <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/25">
          14-day free trial · Cancel anytime
        </p>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#060709] px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        {/* Brand col */}
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              className="text-[#C8FF3E]"
            >
              <WheelSVG className="h-6 w-6" />
            </motion.div>
            <span
              className="text-xl font-black uppercase tracking-[0.12em] text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              CycloAI
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/35">
            AI coaching built for cyclists who want cleaner structure and sharper long-term progression.
          </p>
          <p className="mt-6 text-xs text-white/20">
            © {new Date().getFullYear()} CycloAI. All rights reserved.
          </p>
        </div>

        {[
          { heading: "Explore", links: ["Features", "Pricing", "About", "Blog"] },
          { heading: "Legal", links: ["Privacy", "Terms", "Cookie Policy"] },
          { heading: "Connect", links: ["Twitter / X", "Instagram", "Strava Club"] },
        ].map((col) => (
          <div key={col.heading}>
            <h4
              className="text-xs font-bold uppercase tracking-[0.22em] text-white/30"
            >
              {col.heading}
            </h4>
            <div className="mt-4 flex flex-col gap-3">
              {col.links.map((l) => (
                <Link
                  key={l}
                  href="#"
                  className="text-sm text-white/45 transition hover:text-white"
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}

// ─── PAGE ───────────────────────────────────────────────────────────────────

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#060709] text-white antialiased">
      {/* Google Fonts — Barlow Condensed */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,800;1,900&display=swap');
      `}</style>

      <Navbar scrolled={scrolled} />
      <main>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}