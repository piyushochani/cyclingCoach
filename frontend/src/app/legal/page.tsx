import Link from "next/link";

const sections = [
  { title: "Privacy Policy", href: "/privacy", desc: "How we collect, use, and protect your personal data." },
  { title: "Terms & Conditions", href: "/terms", desc: "Rules and guidelines for using CyclogenAI." },
  { title: "Cookie Policy", href: "/cookie-policy", desc: "How we use cookies and similar technologies." },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#050506] text-white antialiased">
      <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>

        <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white md:text-5xl">
          Legal
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/50">
          Everything you need to know about using CyclogenAI, your data, and your rights.
        </p>

        <div className="mt-12 space-y-4">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-barlowCondensed text-xl uppercase tracking-wide text-white/80 group-hover:text-white">
                    {s.title}
                  </h2>
                  <p className="mt-1 text-sm text-white/40">{s.desc}</p>
                </div>
                <svg className="h-5 w-5 shrink-0 text-white/20 transition group-hover:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
