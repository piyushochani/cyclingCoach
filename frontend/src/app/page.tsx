"use client";

import React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const NAV_LINKS = ["Features", "How It Works", "Pricing", "About", "Reviews"];

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
    accent: "#FF6B00",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
    gradient: "from-[#FF6B00]/20 via-[#FF8C00]/10 to-transparent",
  },
  {
    tag: "02 — Intelligence",
    title: "Race-Day\nReadiness",
    body: "Input a target event and CyclogenAI maps out the precise path to peak form — pacing, taper, and final-week sharpening included.",
    accent: "#FF8C00",
    icon: "M13 4l6 6-8 8H5v-6l8-8zM14 5l5 5",
    gradient: "from-[#FF8C00]/20 via-[#FFA94D]/10 to-transparent",
  },
  {
    tag: "03 — Motivation",
    title: "Progress\nEconomy",
    body: "Streaks, milestones, and visual momentum across every training block. Consistency becomes its own reward.",
    accent: "#FF4500",
    icon: "M9.5 14.5c.7.9 1.8 1.4 3.1 1.4 1.6 0 2.9-.8 2.9-2 0-1.3-1.1-1.8-3.1-2.3-1.7-.5-2.8-.9-2.8-2.2 0-1.2 1.1-2 2.7-2 1.1 0 2.1.4 2.8 1.1M12 6.5v11",
    extraPath: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z",
    gradient: "from-[#FF4500]/20 via-[#FF6B00]/10 to-transparent",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Connect your rides",
    body: "Import your Strava, Wahoo, or Garmin history. CyclogenAI reads power, HR, cadence, and recovery signals instantly.",
    img: "C:/Users/piyus/OneDrive/Documents/Workspaces/cyclingCoach/cycling-coach/frontend/images/StravaConnection.webp",
  },
  {
    num: "02",
    title: "AI builds your plan",
    body: "Training load, periodisation, and race goals merge into a personalized structure that evolves week by week.",
    img: null,
  },
  {
    num: "03",
    title: "Ride, refine, repeat",
    body: "Every ride makes the model smarter. CyclogenAI sharpens pacing targets, recovery windows, and next steps automatically.",
    img: null,
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
    quote: "Won my first podium at a regional road race. CyclogenAI had me perfectly peaked.",
    name: "James R.",
    role: "Masters cyclist",
    avatar: "JR",
  },
];

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

function Navbar() {
  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 bg-[#060709] border-b border-white/[0.06]"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5 md:px-14">
        <Link href="/" className="group flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }}>
            <img
              src="/images/cyclogen_logo.png"
              alt="Cyclogen"
              className="h-8 w-auto"
            />
          </motion.div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) =>
            l === "Pricing" ? (
              <Link
                key={l}
                href="#pricing"
                className="font-medium text-sm tracking-wide text-white/50 transition hover:text-white"
              >
                {l}
              </Link>
            ) : (
              <Link
                key={l}
                href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="font-medium text-sm tracking-wide text-white/50 transition hover:text-white"
              >
                {l}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="hidden rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white md:block">
              Log In
            </button>
          </Link>
          <Link href="/signup" onClick={() => { localStorage.removeItem("cyclogenai_user"); localStorage.removeItem("cyclogenai_token"); }}>
            <button
              className="rounded-full px-5 py-2 text-sm font-bold text-black transition hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: "#FF6B00" }}
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
      <div className="absolute inset-0 bg-[#090B0E]">
        <motion.div
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,107,0,0.15), transparent), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(255,140,0,0.08), transparent), radial-gradient(ellipse 100% 50% at 50% 80%, rgba(255,69,0,0.05), transparent)",
            backgroundSize: "200% 200%",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(6,7,9,0.97)_0%,rgba(6,7,9,0.8)_42%,rgba(6,7,9,0.38)_70%,rgba(6,7,9,0.55)_100%)]" />

      <div className="pointer-events-none absolute right-[12%] top-[18%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(255,107,0,0.1),transparent_70%)]" />
      <div className="pointer-events-none absolute right-[30%] top-[30%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,140,0,0.07),transparent_70%)]" />
      <div className="pointer-events-none absolute left-[5%] bottom-[20%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,69,0,0.05),transparent_70%)]" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute right-[8%] top-1/2 -translate-y-1/2 text-[#FF6B00]/[0.04] md:right-[14%]"
      >
        <WheelSVG className="h-[480px] w-[480px] md:h-[600px] md:w-[600px]" />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-8 md:px-14">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
        >
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
              style={{ WebkitTextStroke: "2px #FF6B00", color: "transparent" }}
            >
              Race harder.
            </span>
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-lg text-base leading-7 text-white/55 md:text-lg"
          >
            CyclogenAI turns your rides, fatigue, recovery, and race goals into a
            continuously adapting training system built for long-term performance.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <Link href="/signup" onClick={() => { localStorage.removeItem("cyclogenai_user"); localStorage.removeItem("cyclogenai_token"); }}>
              <button
                className="group flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-black transition hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(255,107,0,0.4)]"
                style={{ background: "#FF6B00" }}
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

          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 flex flex-wrap gap-3"
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

      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#060709] to-transparent" />
    </section>
  );
}

function StatsBar() {
  return (
    <section className="relative border-y border-white/[0.06] bg-[#060709] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,0,0.03),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-8 py-10 md:px-14">
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
                className="text-4xl font-black uppercase tracking-tight md:text-5xl"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#FF6B00" }}
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
    <section id="features" className="relative bg-[#060709] px-8 py-20 md:px-14 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,0,0.03),transparent_50%)]" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">
            What we offer
          </p>
          <h2
            className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Every edge,<br />
            <span style={{ WebkitTextStroke: "2px #FF6B00", color: "transparent" }}>
              engineered.
            </span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.tag}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0C0E12] p-8 transition-all duration-500 hover:border-[#FF6B00]/20 hover:shadow-[0_0_40px_rgba(255,107,0,0.05)]"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle at 50% 0%, ${f.accent}15 0%, transparent 60%)` }}
              />

              <p
                className="mb-4 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: f.accent }}
              >
                {f.tag}
              </p>

              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border"
                style={{ borderColor: `${f.accent}30`, background: `${f.accent}0D` }}
              >
                <svg className="h-7 w-7" fill="none" stroke={f.accent} viewBox="0 0 24 24">
                  {f.extraPath && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d={f.extraPath} />}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d={f.icon} />
                </svg>
              </div>

              <div className="mb-4 h-px w-12" style={{ background: f.accent }} />

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

              <p className="mt-3 text-sm leading-7 text-white/45">{f.body}</p>
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
      className="relative overflow-hidden bg-[#060709] px-8 py-20 md:px-14 md:py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,140,0,0.03),transparent_50%)]" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">
            The system
          </p>
          <h2
            className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Three steps to{" "}
            <span style={{ color: "#FF6B00" }}>faster.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/40">
            A clean loop designed for athletes who want structure without complexity.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3 md:gap-6">
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
              <div className="relative z-10 mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full border border-[#FF6B00]/20 bg-[#0C0E12] transition-shadow">
                <span
                  className="text-3xl font-black text-[#FF6B00]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {step.num}
                </span>
              </div>

              <div className="mb-5 h-48 w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0C0E12]">
                <div className="flex h-full w-full items-center justify-center text-xs font-medium tracking-widest text-white/20 uppercase">
                  ← Image here (step {i + 1})
                </div>
              </div>

              <h3
                className="text-2xl font-black uppercase text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-white/40">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="relative bg-[#060709] px-6 py-20 md:px-10 md:py-2">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,107,0,0.03),transparent_50%)]" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">Pricing</p>
          <h2
            className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            One plan.{" "}
            <span style={{ color: "#FF6B00" }}>Full access.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/40">
            No tiers. No hidden fees. Every feature unlocked from day one.
          </p>
        </div>
        <div className="mx-auto max-w-lg">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0C0E12] p-10 text-center">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,0,0.06),transparent_60%)]" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">Monthly</p>
            <p className="mt-4 text-6xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              $12<span className="text-2xl text-white/30">/mo</span>
            </p>
            <p className="mt-2 text-sm text-white/40">Billed monthly. Cancel anytime.</p>
            <ul className="mt-8 space-y-4 text-left">
              {["AI-powered training plans", "Strava & Garmin sync", "Race-day readiness tools", "Performance analytics dashboard", "Priority support"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                  <svg className="h-4 w-4 shrink-0 text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" onClick={() => { localStorage.removeItem("cyclogenai_user"); localStorage.removeItem("cyclogenai_token"); }}>
              <button className="mt-8 w-full rounded-full px-8 py-4 text-base font-bold text-black transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] active:scale-[0.98]" style={{ background: "#FF6B00" }}>
                Start Free Trial
              </button>
            </Link>
            <p className="mt-3 text-xs text-white/25">14-day free trial · No credit card required</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="relative bg-[#060709] px-6 py-20 md:px-10 md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(255,140,0,0.03),transparent_50%)]" />
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">About</p>
          <h2
            className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Built for{" "}
            <span style={{ color: "#FF6B00" }}>athletes.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/40">
            CyclogenAI was founded by cyclists who were tired of one-size-fits-all training plans.
            We combine sports science with adaptive AI to give every rider a plan that evolves
            as they do — whether you are chasing a podium or just trying to stay consistent.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { value: "10K+", label: "Active Riders" },
            { value: "50K+", label: "Plans Generated" },
            { value: "4.9", label: "Avg. Rating" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-[#0C0E12] p-8 text-center">
              <p className="text-4xl font-black text-[#FF6B00]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="reviews" className="relative bg-[#060709] px-6 py-20 md:px-10 md:py-28">
      

      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">
            Real athletes
          </p>
          <h2
            className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-6xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Results that<br />
            <span style={{ color: "#FF6B00" }}>speak for themselves.</span>
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
              className="rounded-3xl border border-white/[0.07] bg-[#0C0E12] p-8 transition-all duration-300 hover:border-[#FF6B00]/15 hover:shadow-[0_0_30px_rgba(255,107,0,0.05)]"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, si) => (
                  <svg key={si} className="h-4 w-4" fill="#FF6B00" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              <p className="text-base leading-7 text-white/65">"{t.quote}"</p>

              <div className="mt-6 flex items-center gap-3">
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
    <section className="relative overflow-hidden bg-[#060709] px-6 pb-20 pt-10 md:px-10 md:pb-28">
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute -right-32 -top-32 text-[#FF6B00]/[0.04]"
        aria-hidden
      >
        <WheelSVG className="h-[500px] w-[500px]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-[#FF6B00]/15 bg-[#0C0E12] p-10 text-center md:p-14"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,0,0.08),transparent_60%)]" />

        <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: "#FF6B00" }}>
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
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-white/45">
          Join cyclists who use CyclogenAI to train with purpose, recover with confidence, and race with precision.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup" onClick={() => { localStorage.removeItem("cyclogenai_user"); localStorage.removeItem("cyclogenai_token"); }}>
            <button
              className="group flex items-center gap-2 rounded-full px-9 py-4 text-base font-bold text-black transition hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,107,0,0.4)] active:scale-[0.98]"
              style={{ background: "#FF6B00" }}
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
    <footer className="border-t border-white/[0.06] bg-[#060709] px-6 py-12 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              className="text-[#FF6B00]"
            >
              <WheelSVG className="h-6 w-6" />
            </motion.div>
            <span
              className="text-xl font-black uppercase tracking-[0.12em] text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              CyclogenAI
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/35">
            AI coaching built for cyclists who want cleaner structure and sharper long-term progression.
          </p>
          <p className="mt-6 text-xs text-white/20">
            © {new Date().getFullYear()} CyclogenAI. All rights reserved.
          </p>
        </div>

        {[
          { heading: "Explore", links: ["Features", "Pricing", "About", "Blog"] },
          { heading: "Legal", links: ["Privacy", "Terms", "Cookie Policy"] },
          { heading: "Connect", links: ["Twitter / X", "Instagram", "Strava Club"] },
        ].map((col) => (
          <div key={col.heading}>
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-white/30">
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

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060709] text-white antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,800;1,900&display=swap');
      `}</style>

      <Navbar />
      <main className="pt-10">
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <AboutSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}