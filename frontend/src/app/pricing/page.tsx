"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MONTHLY_FEATURES, YEARLY_FEATURES } from "../../../components/landing/landing-data";
import { clearSignupStorage } from "../../../components/landing/clearSignupStorage";

const plans: {
  id: string;
  price: string;
  suffix: string;
  label: string;
  cta: string;
  badge?: string;
  features: readonly string[];
}[] = [
  {
    id: "monthly",
    price: "$12",
    suffix: "/mo",
    label: "Billed monthly · Cancel anytime",
    cta: "Start free trial",
    features: MONTHLY_FEATURES,
  },
  {
    id: "yearly",
    price: "$130",
    suffix: "/yr",
    label: "Billed annually · Cancel anytime",
    cta: "Start free trial",
    badge: "Best value",
    features: YEARLY_FEATURES,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050506] text-white antialiased">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28 lg:px-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>

        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B00]/80">Pricing</p>
          <h1 className="mt-3 font-[family-name:var(--font-barlow-condensed)] text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-5xl">
            Choose your plan
          </h1>
          <p className="mt-3 text-base text-white/50">
            Pick the plan that fits your training. Upgrade or switch anytime.
          </p>
        </div>

        <div className="mx-auto mt-14 grid gap-8 md:max-w-3xl md:grid-cols-2">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#FF6B00] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,107,0,0.4)]">
                  {plan.badge}
                </div>
              )}
              <div
                className={`relative overflow-hidden rounded-3xl border p-8 md:p-10 ${
                  plan.badge
                    ? "border-[#FF6B00]/30 bg-[#0c0c0f]"
                    : "border-white/[0.1] bg-[#0c0c0f]"
                }`}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#FF6B00]/10 blur-2xl" aria-hidden />
                <p className="text-center">
                  <span className="font-[family-name:var(--font-barlow-condensed)] text-5xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-xl text-white/40">{plan.suffix}</span>
                </p>
                <p className="mt-1 text-center text-sm text-white/45">{plan.label}</p>

                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white/65">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/15 text-[#FF6B00]">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  onClick={clearSignupStorage}
                  className={`mt-8 block w-full rounded-full py-3.5 text-center text-sm font-semibold transition ${
                    plan.badge
                      ? "bg-[#FF6B00] text-white shadow-[0_0_28px_rgba(255,107,0,0.3)] hover:bg-[#ff7a1a]"
                      : "border border-white/20 text-white hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </Link>
                <p className="mt-3 text-center text-xs text-white/35">14-day free trial · No credit card required</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
