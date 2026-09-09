"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_ITEMS } from "./landing-data";
import { clearSignupStorage } from "./clearSignupStorage";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.06] bg-[#060608]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}
    >
      <Link href="/" className="flex shrink-0 items-center gap-3 px-5 py-4 md:px-8 lg:px-10">
        <img
          src="/images/new_cyclogenAI_logo.png"
          alt="CyclogenAI"
          className="h-12 w-auto md:h-14"
        />
      </Link>

      <nav className="hidden items-center justify-center gap-1 lg:flex">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/55 transition hover:bg-white/[0.04] hover:text-white"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-end gap-3 px-5 py-4 md:px-8 lg:px-10">
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={clearSignupStorage}
            className="rounded-full bg-[#FF6B00] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,107,0,0.35)] transition hover:bg-[#ff7a1a] hover:shadow-[0_0_32px_rgba(255,107,0,0.45)]"
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col border-l border-white/10 bg-[#0a0a0c] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="font-[family-name:var(--font-barlow-condensed)] text-lg font-bold uppercase tracking-wide text-white">
                  Menu
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="rounded-lg p-2 text-white/60 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { scrollToSection(item.id); setMobileOpen(false); }}
                    className="rounded-xl px-4 py-3 text-left text-base font-medium text-white/70 hover:bg-white/[0.04] hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-auto flex flex-col gap-3 pt-8">
                <Link href="/login" className="rounded-xl border border-white/15 py-3 text-center text-sm font-medium text-white">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={clearSignupStorage}
                  className="rounded-xl bg-[#FF6B00] py-3 text-center text-sm font-semibold text-white"
                >
                  Start free
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
