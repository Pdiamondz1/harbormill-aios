import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { Hero } from "@/sections/Hero";
import { CredibilityStrip } from "@/sections/CredibilityStrip";
import { PhilosophyStrip } from "@/sections/PhilosophyStrip";
import { Problem } from "@/sections/Problem";
import { AiosFlagship } from "@/sections/AiosFlagship";
import { Services } from "@/sections/Services";
import { Ladder } from "@/sections/Ladder";
import { LoopAudit } from "@/sections/LoopAudit";
import { TrustStrip } from "@/sections/TrustStrip";
import { CaseStudies } from "@/sections/CaseStudies";
import { About } from "@/sections/About";
import { Faq } from "@/sections/Faq";
import { LeadMagnet } from "@/sections/LeadMagnet";
import { Booking } from "@/sections/Booking";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <Hero />
        <CredibilityStrip />
        <PhilosophyStrip />
        <Problem />
        <AiosFlagship />
        <Services />
        <Ladder />
        <LoopAudit />
        <TrustStrip />
        <CaseStudies />
        <About />
        <Faq />
        <LeadMagnet />
        <Booking />
      </main>
      <SiteFooter />
      <Toaster />
    </div>
  );
}
