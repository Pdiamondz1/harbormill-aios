import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { site } from "@/config/site";
import { Button } from "@/components/ui/button";
import { CalendlyButton } from "@/components/CalendlyButton";
import { AiosDeckPreview } from "@/components/AiosDeckPreview";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      {/* sunrise glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--secondary) / 0.18), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-[420px] w-[420px] rounded-full opacity-50"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.16), transparent 60%)",
        }}
      />

      <div className="container relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-secondary"
          >
            {site.hero.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
          >
            {site.hero.titleLead}
            <br />
            <span className="text-gradient">{site.hero.titleEmph}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {site.hero.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <CalendlyButton size="lg">{site.hero.primaryCta}</CalendlyButton>
            <Button asChild size="lg" variant="outline">
              <a href="#aios">
                {site.hero.secondaryCta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.21, 0.5, 0.31, 1] }}
        >
          <AiosDeckPreview />
        </motion.div>
      </div>
    </section>
  );
}
