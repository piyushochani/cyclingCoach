"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";
import { useDataRefetch } from "../../../lib/useDataRefetch";

const steps = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: "Authorize Strava",
    desc: "Click the \"Re-authorize Strava\" button in your profile dropdown (top-right menu). You'll be taken to Strava's login page.",
    detail: "Make sure you're logged into the Strava account you want to connect.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Approve Permissions",
    desc: "Strava will ask you to grant CyclogenAI access to read your activities, profile, and stats. Click \"Authorize\" to continue.",
    detail: "We only request read permissions — CyclogenAI will never post or modify your Strava data.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: "Auto-Redirect Back",
    desc: "After authorizing, Strava redirects you back to CyclogenAI. Your access tokens are exchanged and stored automatically.",
    detail: "You'll be redirected to the dashboard once complete.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Sync Your Data",
    desc: "Use the \"Refresh\" button in the profile dropdown to pull your latest activities from Strava into CyclogenAI.",
    detail: "Sync processes new rides, runs, and walks — usually takes a few seconds.",
  },
];

const faqItems = [
  {
    q: "What does the Refresh button do?",
    a: "The Refresh button (in your profile dropdown menu) triggers a manual sync that pulls your latest activities from Strava into CyclogenAI. It runs a script that fetches new rides, runs, walks, and other activities you've recorded since the last sync. After syncing, the page reloads to reflect the latest data.",
  },
  {
    q: "What does Re-authorize Strava do?",
    a: "If your Strava connection ever stops working (e.g., tokens expired or were revoked), use the Re-authorize Strava button. It opens the Strava OAuth flow so you can re-grant CyclogenAI access to your Strava account. You'll need to log into Strava and approve permissions again. This is also useful if you want to switch to a different Strava account.",
  },
  {
    q: "How often is my data synced?",
    a: "Data syncs are currently manual via the Refresh button. We recommend syncing after each ride or at least once a week to keep your dashboard up to date. Auto-sync on a schedule is coming soon.",
  },
  {
    q: "What data does CyclogenAI access from Strava?",
    a: "CyclogenAI reads your activity data (distance, duration, elevation, heart rate, power, speed), athlete profile, and stats. We never write data to Strava, post on your behalf, or share your data with third parties. All data stays in your private CyclogenAI account.",
  },
  {
    q: "Can I disconnect Strava at any time?",
    a: "Yes. Go to your Strava settings > My Apps > Revoke access for CyclogenAI. You can also re-authorize later from this page if you change your mind. Disconnecting will stop future syncs but your previously synced data will remain in CyclogenAI.",
  },
];

const termSections = [
  {
    title: "Data We Collect",
    items: [
      "Activity summaries: distance, duration, elevation, speed, power, heart rate, calories",
      "Activity routes and GPS coordinates (if available)",
      "Athlete profile: name, weight, units preference",
      "Activity splits and segment efforts",
    ],
  },
  {
    title: "How We Use It",
    items: [
      "Display your training data on your private dashboard and statistics pages",
      "Power AI coaching features, training plan recommendations, and performance analysis",
      "Track your progress over time with charts, best efforts, and trends",
    ],
  },
  {
    title: "What We DON'T Do",
    items: [
      "We never post activities, updates, or any content to Strava on your behalf",
      "We never share your personal data or activity data with third parties",
      "We never use your data for advertising or profiling outside this application",
      "We never store your Strava password — only OAuth access tokens",
    ],
  },
];

export default function ConnectPage() {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const refetchKey = useDataRefetch();

  useEffect(() => {
    Promise.all([
      api.get("/strava/status").catch(() => ({ connected: false })),
      api.get("/sync/status").catch(() => null),
    ]).then(([strava, sync]) => {
      setStravaConnected(!!strava?.connected);
      setSyncStatus(sync);
    });
  }, [refetchKey]);

  const handleConnect = async () => {
    if (authUrl) {
      window.open(authUrl, "_blank");
      return;
    }
    setLoading(true);
    setFetchError(false);
    try {
      const res = await api.get("/strava/auth-url");
      if (res?.url) {
        setAuthUrl(res.url);
        window.open(res.url, "_blank");
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
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
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Integration
          </p>
          <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
            Connect With <span className="text-[#FF5500]">Strava</span>
          </h1>
          <p className="mt-3 font-dmSans text-sm text-white/50">
            Link your Strava account to bring every ride, run, and adventure into CyclogenAI.
            Your dashboard, statistics, and AI coach will automatically reflect your real training data.
          </p>
        </div>

        {/* Big Connection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative mb-12 overflow-hidden rounded-3xl border border-white/[0.06] bg-surface-cards p-8 md:p-12"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF5500]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#FF5500]/5 blur-3xl" />

          <div className="relative z-[1] flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#FF5500]/10">
              <svg className="h-10 w-10 text-[#FF5500]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172H17.48l-2.093 4.116zM8.614 17.944l2.089-4.116h3.065L8.614 24l-5.15-10.172h2.058l2.093 4.116z" />
              </svg>
            </div>

            <div className="flex-1">
              <h2 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white">
                {loading ? "Connecting..." : stravaConnected ? "Strava Connected" : authUrl ? "Ready to Connect" : "Connect Strava"}
              </h2>
              <p className="font-dmSans mt-2 text-sm leading-relaxed text-white/40">
                {loading
                  ? "Fetching Strava authorization URL..."
                  : stravaConnected
                    ? syncStatus?.isUpToDate
                      ? "Your Strava account is linked and data is up to date."
                      : "Your Strava account is linked. Use Refresh in the menu to pull the latest activities."
                    : authUrl
                    ? "Click below to authorize CyclogenAI to read your Strava activities. The link opens in a new tab."
                    : fetchError
                      ? "Unable to connect to Strava. Please try again later."
                      : "Click the button to connect your Strava account."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="inline-flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172H17.48l-2.093 4.116zM8.614 17.944l2.089-4.116h3.065L8.614 24l-5.15-10.172h2.058l2.093 4.116z" />
                  </svg>
                  {loading ? "Connecting..." : "Connect with Strava"}
                </button>

                <span className="font-dmSans text-[11px] text-white/20">
                  {fetchError ? "Click again to retry connecting to Strava." : "Redirects to strava.com for authorization"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* How It Works — Step by Step */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="font-barlowCondensed mb-8 text-2xl uppercase tracking-wide text-white">
            How to <span className="text-[#FF5500]">Connect</span>
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="group rounded-2xl border border-white/[0.06] bg-surface-cards p-6 transition-all duration-300 hover:border-[#FF5500]/20 hover:shadow-[0_0_20px_rgba(255,85,0,0.04)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF5500]/10 text-[#FF5500]">
                    {step.icon}
                  </div>
                  <span className="font-dmSans text-[10px] font-bold uppercase tracking-[0.14em] text-white/20">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="font-barlowCondensed mb-2 text-lg uppercase tracking-wide text-white">
                  {step.title}
                </h3>
                <p className="font-dmSans text-sm leading-relaxed text-white/40">
                  {step.desc}
                </p>
                <p className="font-dmSans mt-2 text-xs italic text-white/20">
                  {step.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Navbar Feature Explanations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mb-12 rounded-2xl border border-white/[0.06] bg-surface-cards p-6 md:p-8"
        >
          <h2 className="font-barlowCondensed mb-6 text-2xl uppercase tracking-wide text-white">
            Navbar <span className="text-[#FF5500]">Tools</span>
          </h2>
          <p className="font-dmSans mb-6 text-sm text-white/30">
            Two important controls live in your profile dropdown menu (the avatar button in the top-right corner).
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-[#080808] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5500]/10">
                <svg className="h-5 w-5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-barlowCondensed mb-2 text-base uppercase tracking-wide text-white">
                Refresh Button
              </h3>
              <p className="font-dmSans text-sm leading-relaxed text-white/35">
                Triggers a manual sync that pulls your latest Strava activities into CyclogenAI.
                Use it after a ride or whenever you want your dashboard to reflect your newest data.
                The page will reload automatically after syncing.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#FF5500]/5 px-3 py-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-dmSans text-xs text-white/30">Found in your profile dropdown menu</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#080808] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5500]/10">
                <svg className="h-5 w-5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-barlowCondensed mb-2 text-base uppercase tracking-wide text-white">
                Re-authorize Strava
              </h3>
              <p className="font-dmSans text-sm leading-relaxed text-white/35">
                If your Strava connection ever breaks (expired tokens, permission changes), use this to re-link.
                Opens the Strava OAuth flow where you can re-grant access or switch to a different account.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#FF5500]/5 px-3 py-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-dmSans text-xs text-white/30">Also in your profile dropdown menu</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-barlowCondensed mb-6 text-2xl uppercase tracking-wide text-white">
            Frequently Asked <span className="text-[#FF5500]">Questions</span>
          </h2>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.06] bg-surface-cards overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <span className="font-dmSans text-sm font-medium text-white/80">{item.q}</span>
                  <motion.svg
                    animate={{ rotate: expandedFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-4 w-4 shrink-0 text-white/30"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: expandedFaq === i ? "auto" : 0, opacity: expandedFaq === i ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/[0.04] px-6 py-4">
                    <p className="font-dmSans text-sm leading-relaxed text-white/40">{item.a}</p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Terms & Conditions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="rounded-2xl border border-white/[0.06] bg-surface-cards p-6 md:p-8"
        >
          <h2 className="font-barlowCondensed mb-2 text-2xl uppercase tracking-wide text-white">
            Data & <span className="text-[#FF5500]">Privacy</span>
          </h2>
          <p className="font-dmSans mb-6 text-sm text-white/30">
            How CyclogenAI handles your Strava data — transparently.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {termSections.map((section, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-[#080808] p-5">
                <h3 className="font-barlowCondensed mb-3 text-sm uppercase tracking-wide text-white">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF5500]/50" />
                      <span className="font-dmSans text-xs leading-relaxed text-white/35">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#080808] p-5">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="font-dmSans text-sm font-medium text-white/70">Your data stays yours.</p>
                <p className="font-dmSans mt-1 text-xs leading-relaxed text-white/25">
                  CyclogenAI stores your Strava OAuth tokens securely in local configuration files and environment variables.
                  Tokens are never exposed client-side or shared. You can revoke access at any time from your Strava settings.
                  We use the minimal OAuth scope required to read your activity data — no write access is requested or used.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}
