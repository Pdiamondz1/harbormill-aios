import { site } from "@/config/site";
import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";

/** Proof section. Ships as structure with "publishing soon" placeholders — no fabricated results. */
export function CaseStudies() {
  return (
    <Section id="case-studies" className="bg-card/20">
      <SectionHeading
        eyebrow={site.caseStudies.eyebrow}
        title={site.caseStudies.title}
        subtitle={site.caseStudies.subtitle}
      />

      <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2">
        {site.caseStudies.items.map((cs, i) => (
          <Reveal key={cs.industry} delay={i * 0.06}>
            <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-card-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  {cs.industry}
                </span>
                {cs.comingSoon && (
                  <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    Publishing soon
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                The pain
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{cs.pain}</p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What we build
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{cs.loop}</p>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-4 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Result:</span> {cs.result}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">ROI:</span> {cs.roi}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
