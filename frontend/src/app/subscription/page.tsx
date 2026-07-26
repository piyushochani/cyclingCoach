"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "../../../lib/api";

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cyclogenai_user");
    let localUser = null;
    if (stored) {
      try {
        localUser = JSON.parse(stored);
        setUser(localUser);
      } catch {}
    }
    api.get("/subscription").then(setSubscription).catch(() => {
      setSubscription(null);
    }).finally(() => setLoading(false));
  }, []);

  const tier = subscription?.tier || user?.subscriptionTier || "free";
  const isPro = tier === "pro";

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#FF5500]" />
      </div>
    );
  }

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
        className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-10 pt-[44px] md:px-6 md:pt-[52px] xl:px-8"
      >
        <div className="mb-8 border-b border-white/10 pb-6 text-center">
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Subscription
          </p>
          <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
            {isPro ? "You are on" : "Upgrade to"}{" "}
            <span className="text-[#FF5500]">Pro</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-dmSans text-sm text-white/50">
            {isPro
              ? "Your subscription is active. Enjoy full access to all features."
              : "Unlock AI training plans, race-day tools, and performance analytics."}
          </p>
        </div>

        <div className="mx-auto max-w-lg">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0C0E12] p-10 text-center">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,0,0.06),transparent_60%)]" />

            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">
              {isPro ? "Current Plan" : "Pro Monthly"}
            </p>
            <p
              className="mt-4 text-6xl font-black text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              $12<span className="text-2xl text-white/30">/mo</span>
            </p>
            <p className="mt-2 text-sm text-white/40">
              {isPro ? "Your subscription is active" : "Billed monthly. Cancel anytime."}
            </p>

            <ul className="mt-8 space-y-4 text-left">
              {[
                "AI-powered training plans",
                "Strava & Garmin sync",
                "Race-day readiness tools",
                "Performance analytics dashboard",
                "Priority support",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                  <svg className="h-4 w-4 shrink-0 text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {isPro ? (
              <div className="mt-8 space-y-3">
                <div className="rounded-full border border-[#FF6B00]/20 bg-[#FF6B00]/5 px-8 py-4 text-sm font-medium text-[#FF6B00]">
                  ✓ Pro features unlocked
                </div>
                <Link href="/dashboard">
                  <button className="w-full rounded-full border border-white/15 px-8 py-4 text-base font-medium text-white/70 transition hover:border-white/30 hover:text-white">
                    Go to Dashboard
                  </button>
                </Link>
              </div>
            ) : (
              <Link href="/signup">
                <button
                  className="mt-8 w-full rounded-full px-8 py-4 text-base font-bold text-black transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] active:scale-[0.98]"
                  style={{ background: "#FF6B00" }}
                >
                  Start Free Trial
                </button>
              </Link>
            )}

            <p className="mt-4 text-xs text-white/25">
              14-day free trial · No credit card required
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
