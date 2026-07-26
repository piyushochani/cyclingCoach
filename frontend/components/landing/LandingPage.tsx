"use client";

import LandingNav from "./LandingNav";
import HeroSection from "./HeroSection";
import StatsBar from "./StatsBar";
import FeaturesSection from "./FeaturesSection";
import HowItWorksSection from "./HowItWorksSection";
import PricingSection from "./PricingSection";
import AboutSection from "./AboutSection";
import TestimonialsSection from "./TestimonialsSection";
import CTASection from "./CTASection";
import LandingFooterSection from "./LandingFooterSection";

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-[#050506] text-white antialiased">
      <LandingNav />
      <main>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <AboutSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <LandingFooterSection />
    </div>
  );
}
