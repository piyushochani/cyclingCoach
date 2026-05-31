"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cycloai_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const isPro = user?.subscriptionTier === "pro";

  return (
    <div className="min-h-screen bg-[#060709] text-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">
            Subscription
          </p>
          <h1
            className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {isPro ? "You are on" : "Upgrade to"}{" "}
            <span style={{ color: "#FF6B00" }}>Pro</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/40">
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
      </div>
    </div>
  );
}
