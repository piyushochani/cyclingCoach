"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";

const PLANS: {
  id: string;
  price: string;
  suffix: string;
  label: string;
  badge?: string;
  features: string[];
}[] = [
  {
    id: "monthly",
    price: "$12",
    suffix: "/mo",
    label: "Billed monthly · Cancel anytime",
    features: [
      "AI-powered training plans",
      "Strava & device sync",
      "Race-day readiness tools",
      "Performance analytics dashboard",
      "AI coach chat",
      "Priority support",
    ],
  },
  {
    id: "yearly",
    price: "$130",
    suffix: "/yr",
    label: "Billed annually · Cancel anytime",
    badge: "Best value",
    features: [
      "AI-powered training plans",
      "Strava & device sync",
      "Race-day readiness tools",
      "Performance analytics dashboard",
      "AI coach chat",
      "Priority support",
      "Advanced periodization blocks",
      "Race-day weather & route analysis",
      "Recovery & nutrition insights",
      "Exclusive training community",
    ],
  },
];

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const subscriptionSwitch = subscription?.subscriptionSwitch ?? false;
  const tier = subscription?.tier || user?.subscriptionTier || "free";
  const isPro = tier === "pro";

  const openPayment = (planId: string) => {
    setSelectedPlan(planId);
    setShowPayment(true);
    setError("");
    setSuccess(false);
    setCardNumber("");
    setExpiry("");
    setCvc("");
  };

  const handlePurchase = async () => {
    setError("");
    setPaying(true);
    try {
      const result: any = await api.post("/subscription/purchase", {
        planId: selectedPlan,
        cardNumber,
        expiry,
        cvc,
      });
      setSuccess(true);
      setSubscription((prev: any) => ({ ...prev, tier: "pro", status: "active", endDate: result.endDate }));
      setTimeout(() => {
        setShowPayment(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

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
            {!subscriptionSwitch ? (
              <>Full <span className="text-[#FF5500]">Access</span></>
            ) : isPro ? (
              <>You are on <span className="text-[#FF5500]">Pro</span></>
            ) : (
              <>Upgrade to <span className="text-[#FF5500]">Pro</span></>
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-dmSans text-sm text-white/50">
            {!subscriptionSwitch
              ? "Subscription billing is currently disabled. All features are available to every user."
              : isPro
              ? "Your subscription is active. Enjoy full access to all features."
              : "Unlock AI training plans, race-day tools, and performance analytics."}
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0C0E12] p-8 text-center"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#FF6B00] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,107,0,0.4)]">
                  {plan.badge}
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,0,0.06),transparent_60%)]" />

              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">
                {isPro && plan.id === "monthly" ? "Current Plan" : `Pro ${plan.id === "monthly" ? "Monthly" : "Yearly"}`}
              </p>
              <p
                className="mt-4 text-6xl font-black text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {plan.price}<span className="text-2xl text-white/30">{plan.suffix}</span>
              </p>
              <p className="mt-2 text-sm text-white/40">{plan.label}</p>

              <ul className="mt-8 space-y-4 text-left">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                    <svg className="h-4 w-4 shrink-0 text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              {subscriptionSwitch ? (
                isPro ? (
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="mt-8 w-full rounded-full border border-white/15 px-8 py-4 text-base font-medium text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => openPayment(plan.id)}
                    className={`mt-8 w-full rounded-full px-8 py-4 text-base font-bold transition active:scale-[0.98] ${
                      plan.badge
                        ? "bg-[#FF6B00] text-black hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] hover:scale-[1.02]"
                        : "border border-white/20 text-white hover:bg-white/5"
                    }`}
                    style={plan.badge ? { background: "#FF6B00" } : {}}
                  >
                    Subscribe Now
                  </button>
                )
              ) : (
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="mt-8 w-full rounded-full border border-white/15 px-8 py-4 text-base font-medium text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Go to Dashboard
                </button>
              )}
              <p className="mt-4 text-xs text-white/25">
                14-day free trial · No credit card required
              </p>
            </div>
          ))}
        </div>
      </motion.main>

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-3xl border border-white/[0.07] bg-[#0C0E12] p-8"
          >
            <button
              onClick={() => setShowPayment(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white">
              {selectedPlan === "yearly" ? "$130/yr" : "$12/mo"} · Pro Plan
            </h2>
            <p className="mt-1 text-sm text-white/40">Enter your card details to subscribe</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Card Number</label>
                <input
                  type="text"
                  placeholder="1111 1111 1111 1111"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-[#FF6B00]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-[#FF6B00]/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-[#FF6B00]/50"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              {success ? (
                <div className="rounded-xl bg-green-500/10 p-4 text-center text-sm text-green-400">
                  Subscription activated! Redirecting...
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={paying || !cardNumber || !expiry || !cvc}
                  className="mt-2 w-full rounded-full bg-[#FF6B00] px-8 py-4 text-base font-bold text-black transition hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paying ? "Processing..." : `Pay ${selectedPlan === "yearly" ? "$130" : "$12"}`}
                </button>
              )}

              <p className="text-center text-xs text-white/25">
                Test card: 1111 1111 1111 1111 · Exp: 11/11 · CVC: 111
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
