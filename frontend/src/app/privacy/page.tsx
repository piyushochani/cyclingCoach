import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050506] text-white antialiased">
      <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
        <Link
          href="/legal"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Legal
        </Link>

        <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-white/30">Last updated: July 26, 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-white/60">
          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">1. Introduction</h2>
            <p>
              CyclogenAI (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered cycling coaching platform and related services.
            </p>
            <p className="mt-3">
              By accessing or using CyclogenAI, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">2. Information We Collect</h2>
            <h3 className="mb-1.5 font-semibold text-white/70">Personal Information</h3>
            <p>
              When you create an account, we collect your name, email address, and password. You may also provide additional profile information such as your age, weight, height, and cycling experience.
            </p>
            <h3 className="mb-1.5 mt-4 font-semibold text-white/70">Activity Data</h3>
            <p>
              With your permission, we collect data from connected devices and platforms (e.g., Strava, Garmin) including ride routes, distance, speed, elevation, heart rate, power output, and other performance metrics.
            </p>
            <h3 className="mb-1.5 mt-4 font-semibold text-white/70">Usage Data</h3>
            <p>
              We automatically collect information about how you interact with our platform, including pages visited, features used, and session duration.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">3. How We Use Your Information</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Provide, maintain, and improve our AI coaching services</li>
              <li>Generate personalized training plans and performance insights</li>
              <li>Analyze trends and aggregate anonymized data for research</li>
              <li>Communicate with you about updates, features, and support</li>
              <li>Ensure platform security and prevent abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We may share your data in the following circumstances:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform (e.g., cloud hosting, analytics)</li>
              <li><strong>Legal Compliance:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time. Certain data may be retained longer to comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS) and at rest, secure data storage, and access controls. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at <span className="text-white/80">support@cyclogenai.app</span>.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">8. Third-Party Services</h2>
            <p>
              Our platform integrates with third-party services such as Strava, Garmin, and others. Data shared with these services is governed by their respective privacy policies. We encourage you to review their policies before connecting accounts.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">9. Children&apos;s Privacy</h2>
            <p>
              CyclogenAI is not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or through our platform. Your continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">11. Contact</h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at <span className="text-white/80">support@cyclogenai.app</span>.
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
