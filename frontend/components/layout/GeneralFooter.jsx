"use client";

import React from "react";
import Link from "next/link";

export default function GeneralFooter() {
  return (
    <footer className="border-t border-white/[0.04] bg-black px-6 py-12 md:px-16">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Logo + About */}
          <div className="md:col-span-1">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <svg className="h-6 w-6 text-[#FF5500]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
                <path d="M50 10 L50 90 M15 50 L85 50" stroke="currentColor" strokeWidth="4" />
              </svg>
              <span className="font-barlowCondensed text-lg uppercase tracking-wide text-white/70">
                CyclogenAI
              </span>
            </Link>
            <p className="font-dmSans mt-3 max-w-xs text-[13px] leading-relaxed text-white/25">
              AI-powered cycling coach that helps you train smarter, track your progress, and reach your performance goals with personalized training plans and analytics.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-dmSans mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Activities", href: "/activities" },
                { name: "Statistics", href: "/statistics" },
                { name: "Gears", href: "/gears" },
                { name: "Settings", href: "/settings" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-dmSans text-[13px] text-white/25 transition-colors hover:text-white/60"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms & Policies */}
          <div>
            <h4 className="font-dmSans mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
              Terms & Policies
            </h4>
            <ul className="space-y-2.5">
              {[
                { name: "Terms of Service", href: "/terms" },
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Cookie Policy", href: "/cookie-policy" },
                { name: "Legal", href: "/legal" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-dmSans text-[13px] text-white/25 transition-colors hover:text-white/60"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Reach Us */}
          <div>
            <h4 className="font-dmSans mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
              Reach Us
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-dmSans text-[13px] text-white/25">support@cyclogenai.app</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6l4 2" />
                </svg>
                <span className="font-dmSans text-[13px] text-white/25">Mon–Fri, 9:00–18:00</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-dmSans text-[13px] text-white/25">San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/[0.04] pt-6">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <p className="font-dmSans text-[12px] text-white/15">
              &copy; {new Date().getFullYear()} CyclogenAI. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {[
                { name: "Twitter", path: "M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.3 4.25 17.23 3.5 16 3.5c-2.38 0-4.31 1.93-4.31 4.31 0 .34.04.67.11.98-3.58-.18-6.74-1.89-8.86-4.48-.37.64-.58 1.39-.58 2.19 0 1.49.76 2.81 1.92 3.59-.7-.02-1.37-.21-1.95-.5v.05c0 2.09 1.49 3.82 3.47 4.21-.36.1-.73.15-1.12.15-.27 0-.53-.02-.79-.08.55 1.72 2.14 2.98 4.02 3.01-1.48 1.16-3.35 1.85-5.39 1.85-.35 0-.69-.02-1.03-.06 1.93 1.24 4.23 1.96 6.7 1.96 8.04 0 12.44-6.67 12.44-12.45 0-.19-.01-.38-.01-.56.85-.61 1.58-1.37 2.16-2.22z" },
                { name: "GitHub", path: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" },
              ].map((social) => (
                <a key={social.name} href="#" className="text-white/15 transition-colors hover:text-white/40">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
