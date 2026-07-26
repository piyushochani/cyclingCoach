import Link from "next/link";

export default function CookiePolicyPage() {
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
          Back to Legal
        </Link>

        <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white md:text-5xl">
          Cookie Policy
        </h1>
        <p className="mt-2 text-sm text-white/30">Last updated: July 26, 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-white/60">
          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device by your web browser when you visit a website. They help websites recognize your device, remember your preferences, and improve your browsing experience.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">2. How We Use Cookies</h2>
            <p>CyclogenAI uses cookies and similar technologies for the following purposes:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Essential Cookies:</strong> Required for the Platform to function, including authentication and session management</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the Platform so we can improve it</li>
              <li><strong>Functional Cookies:</strong> Enable enhanced features like remembering your login state</li>
            </ul>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">3. Third-Party Cookies</h2>
            <p>
              We may use third-party services that set their own cookies:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Analytics:</strong> We use analytics providers to understand platform usage patterns</li>
              <li><strong>Payment Processing:</strong> Our payment processor may set cookies for fraud prevention and session management</li>
              <li><strong>Authentication:</strong> Third-party OAuth providers (e.g., Strava) may set cookies during the connection process</li>
            </ul>
            <p className="mt-3">
              These third parties have their own cookie policies. We encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">4. Your Cookie Choices</h2>
            <p>
              When you first visit CyclogenAI, you will be presented with a cookie consent notice. You can manage your preferences through:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Your browser settings (most browsers allow you to block or delete cookies)</li>
              <li>Our cookie consent manager (available on first visit and through your account settings)</li>
              <li>Third-party opt-out tools (e.g., <span className="text-white/70">Your Online Choices</span> for EU users)</li>
            </ul>
            <p className="mt-3">
              Blocking essential cookies may prevent the Platform from functioning properly.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">5. Types of Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-white/50">
                    <th className="pb-2 pr-4 font-semibold">Type</th>
                    <th className="pb-2 pr-4 font-semibold">Purpose</th>
                    <th className="pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-white/50">
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 text-white/70">Session</td>
                    <td className="py-2 pr-4">Maintain login session</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 text-white/70">CSRF Token</td>
                    <td className="py-2 pr-4">Security against cross-site requests</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 text-white/70">Preferences</td>
                    <td className="py-2 pr-4">Remember user settings</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 text-white/70">Analytics</td>
                    <td className="py-2 pr-4">Usage and performance tracking</td>
                    <td className="py-2">Up to 2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">6. Do Not Track</h2>
            <p>
              Some browsers support a &ldquo;Do Not Track&rdquo; (DNT) signal. As there is not yet a consistent industry standard for responding to DNT signals, we currently do not respond to them. We will update this policy once a standard is established.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">7. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy to reflect changes in our practices or applicable regulations. The &ldquo;Last updated&rdquo; date at the top will reflect the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">8. Contact</h2>
            <p>
              If you have questions about our use of cookies, contact us at <span className="text-white/80">support@cyclogenai.app</span>.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-white/[0.06] pt-6 text-center text-xs text-white/20">
          &copy; {new Date().getFullYear()} CyclogenAI. All rights reserved.
        </div>
      </div>
    </div>
  );
}
