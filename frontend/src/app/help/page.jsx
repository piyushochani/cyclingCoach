"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "How do I connect my Strava account?",
    a: "Go to the Connect page from the sidebar, click 'Connect Strava', and authorize the app. Your rides will sync automatically every 2 hours. You can also trigger a manual sync from the Notifications page.",
  },
  {
    q: "How does the AI training plan work?",
    a: "The AI coach analyzes your recent rides, fitness levels, and goals to generate a personalized weekly training plan. Plans appear on the Calendar page and include structured workouts with prescribed zones, durations, and focus areas.",
  },
  {
    q: "What are Best Efforts?",
    a: "Best Efforts tracks your fastest times over standard distances (1km, 5km, 10km, 20km, etc.) and your top segment efforts from Strava. View them on the Best Efforts page. Data refreshes after each Strava sync.",
  },
  {
    q: "How do I add a race or event?",
    a: "Navigate to Race Results and click 'Add Race'. You can set the date, distance, elevation, and type. Races appear on your Calendar and can have dedicated AI race plans and chat threads.",
  },
  {
    q: "How do I manage my gear?",
    a: "Bikes sync automatically from Strava. You can add custom gear (wheels, helmets, etc.) on the Gears page. Active bike distance is tracked across all activities.",
  },
  {
    q: "How do I track expenses?",
    a: "The Expenses page lets you log bike maintenance, gear purchases, race fees, and nutrition costs. Categorize expenses and track totals over time.",
  },
  {
    q: "What does the AI Chat do?",
    a: "The AI Chat (bottom-right corner) lets you ask questions about your training data, request plan adjustments, get workout recommendations, or analyze a specific ride. It uses your real fitness data to provide coaching advice.",
  },
  {
    q: "How do notifications work?",
    a: "You'll receive notifications when new activities sync, weekly plans are ready, best efforts are updated, or subscription renewal is due. All notifications are on the Notifications page with unread counts.",
  },
  {
    q: "What subscription plans are available?",
    a: "Two Pro plans: $12/month (billed monthly) or $130/year (billed annually, best value). Both unlock AI training plans, race-day tools, advanced analytics, and priority support. The yearly plan adds advanced periodization, race-day weather analysis, recovery insights, and community access. Basic tier is free with core features including Strava sync and activity tracking.",
  },
  {
    q: "How is my data kept private?",
    a: "Your data is stored securely and never shared. Strava tokens are encrypted. The AI coach only accesses your data to generate training recommendations. You can delete your account anytime.",
  },
];

const guides = [
  {
    title: "Getting Started",
    icon: "🚀",
    steps: [
      "Create an account via Signup — you'll receive an OTP to verify your email.",
      "Connect Strava from the Connect page to auto-sync your rides.",
      "Complete onboarding so the AI coach learns your goals and experience.",
      "Explore the Dashboard to see your stats, activities, and training plan.",
      "Open AI Chat (bottom-right) to ask the coach anything.",
    ],
  },
  {
    title: "Using the Calendar",
    icon: "📅",
    steps: [
      "View your monthly schedule with color-coded day indicators (completed, missed, planned, race).",
      "Click any day to see activity details in the right panel.",
      "Navigate months with Prev/Next buttons.",
      "The Weekly Schedule sidebar shows your current week's plan.",
      "Click 'AI Analysis' for a monthly performance review, or 'Optimize' for the current week.",
    ],
  },
  {
    title: "AI Training Plans",
    icon: "🧠",
    steps: [
      "Your weekly plan auto-generates based on recent fitness data and goals.",
      "View planned workouts on the Calendar and AI Training page.",
      "Workouts include prescribed zones, duration, and focus (Endurance, Tempo, Threshold, etc.).",
      "Mark workouts complete from the Calendar or AI Training page.",
      "Click 'Understand better' on any day for AI coaching on that specific workout.",
    ],
  },
  {
    title: "Profile & Settings",
    icon: "⚙️",
    steps: [
      "Update personal info, sport, experience level, FTP, and HR zones on the Profile page.",
      "Change password from the Settings page.",
      "Upload a profile photo with the circular crop tool.",
      "Select or add custom coaches — these are cosmetic and local to your account.",
    ],
  },
  {
    title: "Analyzing Performance",
    icon: "📊",
    steps: [
      "The Statistics page shows charts for distance, duration, elevation, and consistency over time.",
      "View Best Efforts for your top speeds over standard distances.",
      "Click 'AI Deep Review' on any activity for a detailed coaching analysis.",
      "Daily, Weekly, and Monthly review buttons on the Statistics page provide AI-generated performance summaries.",
    ],
  },
  {
    title: "Managing Races",
    icon: "🏁",
    steps: [
      "Add races from the Race Results page with date, distance, and elevation.",
      "Each race gets a dedicated chat thread for race-day strategy discussions.",
      "Create an AI race plan with day-by-day preparation guidance.",
      "Races appear on your Calendar with a special 'RACE' indicator.",
    ],
  },
];

function FaqItem({ faq, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-[#080808] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.02]"
      >
        <span className="font-dmSans text-sm font-medium text-white/85">
          {index + 1}. {faq.q}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-white/30 text-lg leading-none"
        >
          ▼
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="border-t border-white/10 px-5 py-4">
          <p className="font-dmSans text-sm text-white/60 leading-relaxed">{faq.a}</p>
        </div>
      </motion.div>
    </div>
  );
}

function GuideCard({ guide, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-[#080808] p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl">{guide.icon}</span>
        <h3 className="font-barlowCondensed text-xl uppercase tracking-wide text-white">
          {guide.title}
        </h3>
      </div>
      <ol className="space-y-3">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3 font-dmSans text-sm text-white/65">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF5500]/10 text-[10px] font-bold text-[#FF5500]">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-16 pt-[44px] md:px-6 md:pt-[52px] xl:px-8"
      >
        <div className="mb-10 border-b border-white/10 pb-6">
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Resources
          </p>
          <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
            Help & <span className="text-[#FF5500]">Guides</span>
          </h1>
          <p className="mt-4 max-w-2xl font-dmSans text-sm text-white/50 leading-relaxed">
            Everything you need to get the most out of CyclogenAI. Browse the FAQ below or jump to a specific guide.
          </p>
        </div>

        <section className="mb-14">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5500]/10">
              <span className="text-sm text-[#FF5500] font-bold">?</span>
            </div>
            <h2 className="font-barlowCondensed text-3xl uppercase tracking-wide text-white">
              Frequently Asked <span className="text-[#FF5500]">Questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5500]/10">
              <span className="text-sm text-[#FF5500]">📘</span>
            </div>
            <h2 className="font-barlowCondensed text-3xl uppercase tracking-wide text-white">
              Feature <span className="text-[#FF5500]">Guides</span>
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide, i) => (
              <GuideCard key={i} guide={guide} delay={i * 0.05} />
            ))}
          </div>
        </section>
      </motion.main>
    </div>
  );
}
