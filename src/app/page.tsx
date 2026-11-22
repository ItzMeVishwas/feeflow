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
import { Reveal } from "@/components/landing/reveal";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#F6F8FB] font-sans text-[#0A1F3D]">
      <LandingNav />
      <main>
        <LandingHero />
        <Reveal>
          <TrustStrip />
        </Reveal>
        <Reveal>
          <BeforeAfter />
        </Reveal>
        <Reveal>
          <LiveDemo />
        </Reveal>
        <Reveal>
          <HowItWorks />
        </Reveal>
        <Reveal>
          <Features />
        </Reveal>
        <Reveal>
          <Pricing />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
        <Reveal>
          <FinalCta />
        </Reveal>
      </main>
      <LandingFooter />
    </div>
  );
}
