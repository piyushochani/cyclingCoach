import Link from "next/link";

export default function TermsPage() {
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
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-white/30">Last updated: July 26, 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-white/60">
          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using CyclogenAI (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms &amp; Conditions (&ldquo;Terms&rdquo;). If you do not agree, you may not access or use the Platform.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">2. Description of Service</h2>
            <p>
              CyclogenAI provides AI-powered cycling coaching, training plans, performance analytics, and related tools. The Platform processes data from your connected devices and third-party services to generate personalized insights and recommendations.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">3. User Accounts</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>You must be at least 16 years old to create an account</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for all activity under your account</li>
              <li>Notify us immediately of any unauthorized access at <span className="text-white/80">support@cyclogenai.app</span></li>
            </ul>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">4. Subscriptions and Payments</h2>
            <p>
              Certain features require a paid subscription. Subscription fees, billing cycles, and cancellation terms are presented at the point of purchase. All payments are processed securely by our third-party payment processor. Refunds are handled in accordance with our refund policy.
            </p>
            <p className="mt-3">
              We reserve the right to change pricing with reasonable notice. Continued use after price changes constitutes acceptance of the new pricing.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the Platform</li>
              <li>Upload malicious code or content</li>
              <li>Impersonate another person or entity</li>
              <li>Use the Platform to train competing AI models or services</li>
            </ul>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">6. Intellectual Property</h2>
            <p>
              The Platform, including its code, design, content, algorithms, and AI models, is the exclusive property of CyclogenAI. You are granted a limited, non-exclusive, non-transferable license to use the Platform for personal, non-commercial use.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">7. User Data and Content</h2>
            <p>
              You retain ownership of your data and content. By using the Platform, you grant us a license to process, store, and analyze your data to provide and improve our services. We may use anonymized, aggregated data for research and product development.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">8. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not guarantee that the Platform will be uninterrupted, error-free, or that training recommendations will achieve specific results.
            </p>
            <p className="mt-3">
              <strong>Medical Disclaimer:</strong> CyclogenAI is a training tool, not a medical device. Consult a healthcare professional before beginning any training program. We are not responsible for injuries or health issues resulting from use of our platform.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CyclogenAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to loss of data, training performance, or personal injury.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason. Upon termination, your access to the Platform will cease, and we may delete your data in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of San Francisco County, California.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">12. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Material changes will be communicated via email or platform notification. Continued use after changes take effect constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="font-barlowCondensed mb-3 text-xl uppercase tracking-wide text-white/80">13. Contact</h2>
            <p>
              For questions about these Terms, contact us at <span className="text-white/80">support@cyclogenai.app</span>.
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
