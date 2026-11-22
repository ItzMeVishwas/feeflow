import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { BeforeAfter } from "@/components/landing/before-after";
import { LiveDemo } from "@/components/landing/live-demo";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { FinalCta, LandingFooter } from "@/components/landing/final-cta";

export default function LandingPage() {
  return (
    <div className="dark min-h-screen w-full overflow-x-clip bg-[#0E1726] font-sans text-[#E8EDF5]">
      <LandingNav />
      <main>
        <LandingHero />
        <TrustStrip />
        <BeforeAfter />
        <LiveDemo />
        <HowItWorks />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
