"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const TOTAL_FRAMES = 300;
const FRAME_HEIGHT_MULTIPLIER = 4;

const framePath = (i: number) =>
  `/images/cinematic_frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return progress;
}

function lerpOpacity(progress: number, start: number, end: number, fade: number = 0.06) {
  const fadeIn = Math.min(1, Math.max(0, (progress - start) / fade));
  const fadeOut = Math.min(1, Math.max(0, (end - progress) / fade));
  return Math.min(fadeIn, fadeOut);
}

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
  },
  {
    tag: "02 — Intelligence",
    title: "Race-Day\nReadiness",
    body: "Input a target event and CyclogenAI maps out the precise path to peak form — pacing, taper, and final-week sharpening included.",
    accent: "#FF8C00",
    icon: "M13 4l6 6-8 8H5v-6l8-8zM14 5l5 5",
  },
  {
    tag: "03 — Motivation",
    title: "Progress\nEconomy",
    body: "Streaks, milestones, and visual momentum across every training block. Consistency becomes its own reward.",
    accent: "#FF4500",
    icon: "M9.5 14.5c.7.9 1.8 1.4 3.1 1.4 1.6 0 2.9-.8 2.9-2 0-1.3-1.1-1.8-3.1-2.3-1.7-.5-2.8-.9-2.8-2.2 0-1.2 1.1-2 2.7-2 1.1 0 2.1.4 2.8 1.1M12 6.5v11",
    extraPath: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Connect your rides",
    body: "Import your Strava, Wahoo, or Garmin history. CyclogenAI reads power, HR, cadence, and recovery signals instantly.",
  },
  {
    num: "02",
    title: "AI builds your plan",
    body: "Training load, periodisation, and race goals merge into a personalized structure that evolves week by week.",
  },
  {
    num: "03",
    title: "Ride, refine, repeat",
    body: "Every ride makes the model smarter. CyclogenAI sharpens pacing targets, recovery windows, and next steps automatically.",
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

function usePreloader(frameIndex: number) {
  const loaded = useRef(new Set<number>());

  useEffect(() => {
    const start = Math.max(1, frameIndex - 5);
    const end = Math.min(TOTAL_FRAMES, frameIndex + 20);
    for (let i = start; i <= end; i++) {
      if (!loaded.current.has(i)) {
        loaded.current.add(i);
        const img = new Image();
        img.src = framePath(i);
      }
    }
  }, [frameIndex]);
}

function scrollToProgress(target: number) {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: target * docHeight, behavior: "smooth" });
}

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black backdrop-blur-md border-b border-white/[0.06]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5 md:px-14">
        <Link href="/" className="group flex items-center gap-3">
          <img
            src="/images/new_cyclogenAI_logo.png"
            alt="Cyclogen"
            className="h-12 w-auto"
          />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <button onClick={() => scrollToProgress(0)} className="font-medium text-sm tracking-wide text-white/50 transition hover:text-white">
            Home
          </button>
          <button onClick={() => scrollToProgress(0.41)} className="font-medium text-sm tracking-wide text-white/50 transition hover:text-white">
            Features
          </button>
          <button onClick={() => scrollToProgress(0.56)} className="font-medium text-sm tracking-wide text-white/50 transition hover:text-white">
            How It Works
          </button>
          <button onClick={() => scrollToProgress(0.68)} className="font-medium text-sm tracking-wide text-white/50 transition hover:text-white">
            Pricing
          </button>
          <button onClick={() => scrollToProgress(0.76)} className="font-medium text-sm tracking-wide text-white/50 transition hover:text-white">
            About
          </button>
          <button onClick={() => scrollToProgress(0.84)} className="font-medium text-sm tracking-wide text-white/50 transition hover:text-white">
            Reviews
          </button>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="hidden rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white md:block">
              Log In
            </button>
          </Link>
          <Link href="/signup" onClick={() => { localStorage.removeItem("cyclogenai_user"); localStorage.removeItem("cyclogenai_token"); localStorage.removeItem("cyclogenai_signed_in"); localStorage.removeItem("cyclogenai_session_ts"); }}>
            <button className="rounded-full px-5 py-2 text-sm font-bold text-white transition hover:scale-[1.03] active:scale-[0.98]" style={{ background: "#FF6B00" }}>
              Start Free →
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function FloatingSection({
  progress,
  start,
  end,
  fade,
  style,
  className,
  children,
}: {
  progress: number;
  start: number;
  end: number;
  fade?: number;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}) {
  const opacity = lerpOpacity(progress, start, end, fade);
  const visible = opacity > 0.01;

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        opacity,
        transform: `translateY(${(1 - opacity) * 20}px)`,
        transition: "opacity 0.15s ease-out, transform 0.15s ease-out",
        pointerEvents: visible ? "auto" : "none",
        zIndex: 10,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const progress = useScrollProgress();
  const frameIndex = Math.min(Math.floor(progress * TOTAL_FRAMES), TOTAL_FRAMES - 1);
  const currentFrame = frameIndex + 1;
  usePreloader(currentFrame);

  return (
    <div className="min-h-screen text-white antialiased overflow-x-hidden" style={{ background: "#0A0A0A" }}>
      {/* Fixed frame background */}
      <div className="fixed inset-0 z-0">
        <img
          src={framePath(currentFrame)}
          alt=""
          className="w-full h-full object-cover"

        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-black/30" />
      </div>

      {/* Spacer for scroll — 300 frames * 4 viewports each */}
      <div style={{ height: `${TOTAL_FRAMES * FRAME_HEIGHT_MULTIPLIER}vh` }} />

      {/* Fixed Navbar */}
      <Navbar />

      {/* === HERO === */}
      <FloatingSection
        progress={progress}
        start={0}
        end={0.2}
        className="left-[8%] right-[8%] md:left-[14%] md:right-[14%]"
        style={{ top: "28%", maxWidth: 800 }}
      >
        <h1
          className="uppercase leading-[0.88] tracking-tight text-white"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 9vw, 8rem)", fontWeight: 800 }}
        >
          Train smarter.{" "}
          <span className="italic text-white">
            Race harder.
          </span>
        </h1>
      </FloatingSection>

      <FloatingSection
        progress={progress}
        start={0}
        end={0.2}
        className="left-[8%] right-[8%] md:left-[14%] md:right-[14%]"
        style={{ top: "42%", maxWidth: 540 }}
      >
        <p className="text-base leading-7 text-white/70 md:text-lg">
          CyclogenAI turns your rides, fatigue, recovery, and race goals into a
          continuously adapting training system built for long-term performance.
        </p>
      </FloatingSection>

      <FloatingSection
        progress={progress}
        start={0}
        end={0.2}
        className="left-[8%] md:left-[14%]"
        style={{ top: "62%" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link href="/signup" onClick={() => { localStorage.removeItem("cyclogenai_user"); localStorage.removeItem("cyclogenai_token"); localStorage.removeItem("cyclogenai_signed_in"); localStorage.removeItem("cyclogenai_session_ts"); }}>
            <button
              className="group flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "#FF6B00" }}
            >
              Start Training Free
              <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </Link>
          <button
            onClick={() => scrollToProgress(0.56)}
            className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-medium text-white/70 backdrop-blur-sm transition hover:border-white/40 hover:text-white"
          >
            See How It Works
          </button>
        </div>
      </FloatingSection>

      <FloatingSection
        progress={progress}
        start={0}
        end={0.2}
        className="left-[8%] md:left-[14%]"
        style={{ top: "80%" }}
      >
        <div className="flex flex-wrap gap-3">
          {["53,000+ km analyzed", "Adaptive plans", "Race-day precision"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-white/60"
            >
              {chip}
            </span>
          ))}
        </div>
      </FloatingSection>

      {/* === STATS === */}
      <FloatingSection
        progress={progress}
        start={0.18}
        end={0.34}
        className="inset-x-[8%] md:inset-x-[14%]"
        style={{ top: "30%" }}
      >
        <div className="rounded-2xl border border-white/[0.08]" style={{ background: "#111318" }}>
          <div className="grid grid-cols-2 gap-6 p-8 md:grid-cols-4">
            {STATS.map((s, i) => (
              <div key={s.label} className="text-center">
                <p
                  className="text-3xl font-black uppercase tracking-tight md:text-4xl"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#ffffff" }}
                  >
                    {s.value}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FloatingSection>

      {/* === FEATURES === */}
      <FloatingSection
        progress={progress}
        start={0.3}
        end={0.52}
        className="inset-x-[6%] md:inset-x-[10%]"
        style={{ top: "18%", bottom: "18%" }}
      >
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/40">What we offer</p>
          <h2
            className="mt-2 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Every edge,{" "}
            <span className="text-white">engineered.</span>
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.tag}
              className="rounded-2xl border border-white/[0.08] p-6 transition-all duration-300 hover:border-white/20"
              style={{ background: "#111318" }}
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                {f.tag}
              </p>
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04]"
              >
                <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {f.extraPath && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d={f.extraPath} />}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d={f.icon} />
                </svg>
              </div>
              <h3
                className="text-2xl font-black uppercase leading-tight tracking-tight text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {f.title.split("\n").map((line, j) => (
                  <React.Fragment key={j}>
                    {line}{j < f.title.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{f.body}</p>
            </div>
          ))}
        </div>
      </FloatingSection>

      {/* === HOW IT WORKS === */}
      <FloatingSection
        progress={progress}
        start={0.46}
        end={0.66}
        className="inset-x-[6%] md:inset-x-[10%]"
        style={{ top: "20%", bottom: "20%" }}
      >
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/40">The system</p>
          <h2
            className="mt-2 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Three steps to <span className="text-white">faster.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/50">
            A clean loop designed for athletes who want structure without complexity.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="rounded-2xl border border-white/[0.08] p-6"
              style={{ background: "#111318" }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.12]" style={{ background: "#111318" }}>
                <span className="text-xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {step.num}
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/50">{step.body}</p>
            </div>
          ))}
        </div>
      </FloatingSection>

      {/* === PRICING === */}
      <FloatingSection
        progress={progress}
        start={0.6}
        end={0.76}
        className="left-0 right-0 mx-auto"
        style={{ top: "22%", maxWidth: 420, width: "90%" }}
      >
        <div className="rounded-2xl border border-white/[0.08] p-8 text-center" style={{ background: "#111318" }}>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/40">Pricing</p>
          <h2
            className="mt-3 text-4xl font-black uppercase leading-none tracking-tight text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            One plan. <span className="text-white">Full access.</span>
          </h2>
          <p className="mt-2 text-5xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            $12<span className="text-2xl text-white/40">/mo</span>
          </p>
          <p className="mt-1 text-sm text-white/50">Billed monthly. Cancel anytime.</p>
          <ul className="mt-6 space-y-3 text-left">
            {["AI-powered training plans", "Strava & Garmin sync", "Race-day readiness tools", "Performance analytics dashboard", "Priority support"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/65">
                <svg className="h-4 w-4 shrink-0 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <Link href="/signup" onClick={() => { localStorage.removeItem("cyclogenai_user"); localStorage.removeItem("cyclogenai_token"); localStorage.removeItem("cyclogenai_signed_in"); localStorage.removeItem("cyclogenai_session_ts"); }}>
            <button className="mt-6 w-full rounded-full px-8 py-4 text-base font-bold text-white transition hover:scale-[1.02]" style={{ background: "#FF6B00" }}>
              Start Free Trial
            </button>
          </Link>
          <p className="mt-2 text-xs text-white/30">14-day free trial · No credit card required</p>
        </div>
      </FloatingSection>

      {/* === ABOUT === */}
      <FloatingSection
        progress={progress}
        start={0.7}
        end={0.82}
        className="inset-x-[8%] md:inset-x-[14%]"
        style={{ top: "28%", maxWidth: 700 }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/40">About</p>
        <h2
          className="mt-2 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Built for <span className="text-white">athletes.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
          CyclogenAI was founded by cyclists who were tired of one-size-fits-all training plans.
          We combine sports science with adaptive AI to give every rider a plan that evolves
          as they do.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Active Riders", "Plans Generated", "Avg. Rating"].map((label, i) => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.08] p-6 text-center"
              style={{ background: "#111318" }}
            >
              <p className="text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {["10K+", "50K+", "4.9"][i]}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </FloatingSection>

      {/* === TESTIMONIALS === */}
      <FloatingSection
        progress={progress}
        start={0.78}
        end={0.9}
        className="inset-x-[6%] md:inset-x-[10%]"
        style={{ top: "18%", bottom: "18%" }}
      >
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/40">Real athletes</p>
          <h2
            className="mt-2 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Results that <span className="text-white">speak.</span>
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-white/[0.08] p-6"
              style={{ background: "#111318" }}
            >
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, si) => (
                  <svg key={si} className="h-3.5 w-3.5 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm leading-6 text-white/65">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#111318] text-xs font-bold text-white/60">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FloatingSection>

      {/* === CTA === */}
      <FloatingSection
        progress={progress}
        start={0.86}
        end={0.97}
        className="left-0 right-0 mx-auto"
        style={{ top: "28%", maxWidth: 560, width: "90%" }}
      >
        <div
          className="rounded-3xl border border-white/[0.08] p-10 text-center"
          style={{ background: "#111318" }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/60">
            Ready to perform?
          </p>
          <h2
            className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Your best season starts now.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
            Join cyclists who use CyclogenAI to train with purpose, recover with confidence, and race with precision.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup" onClick={() => { localStorage.removeItem("cyclogenai_user"); localStorage.removeItem("cyclogenai_token"); localStorage.removeItem("cyclogenai_signed_in"); localStorage.removeItem("cyclogenai_session_ts"); }}>
              <button
                className="group flex items-center gap-2 rounded-full px-9 py-4 text-base font-bold text-white transition hover:scale-[1.03]"
                style={{ background: "#FF6B00" }}
              >
                Start Free — No Credit Card
                <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/35">14-day free trial · Cancel anytime</p>
        </div>
      </FloatingSection>

      {/* === FOOTER === */}
      <FloatingSection
        progress={progress}
        start={0.93}
        end={1.02}
        className="inset-x-[6%] md:inset-x-[10%]"
        style={{ top: "auto", bottom: "5%" }}
      >
        <div className="border-t border-white/[0.08] pt-8">
          <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className="text-xl font-black uppercase tracking-[0.12em] text-white"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  CyclogenAI
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/35">
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
                <div className="mt-4 flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <span key={l} className="text-sm text-white/45 transition cursor-default hover:text-white">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingSection>
    </div>
  );
}
