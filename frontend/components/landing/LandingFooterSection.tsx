"use client";

import Link from "next/link";
import { NAV_ITEMS } from "./landing-data";

const FOOTER_COLS = [
  { heading: "Explore", links: NAV_ITEMS.map((n) => ({ label: n.label, href: `#${n.id}` })) },
  { heading: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Cookie Policy", href: "/cookie-policy" }] },
  { heading: "Connect", links: [{ label: "Twitter / X", href: "#" }, { label: "Instagram", href: "#" }, { label: "Strava Club", href: "#" }] },
] as const;

export default function LandingFooterSection() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#040406] py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/images/new_cyclogenAI_logo.png" alt="CyclogenAI" className="h-8 w-auto opacity-90" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/35">
              AI coaching built for cyclists who want cleaner structure and sharper long-term progression.
            </p>
            <p className="mt-8 text-xs text-white/25">
              © {new Date().getFullYear()} CyclogenAI. All rights reserved.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/45 transition hover:text-white/80"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
