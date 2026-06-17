import { useEffect, useRef } from "react";
import { site, CALENDLY_URL } from "@/config/site";
import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { loadCalendly, themedCalendlyUrl } from "@/lib/calendly";

export function Booking() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadCalendly().then(() => {
      if (cancelled || !ref.current || ref.current.childElementCount > 0) return;
      window.Calendly?.initInlineWidget({
        url: themedCalendlyUrl(CALENDLY_URL),
        parentElement: ref.current,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section id="book" className="bg-card/20">
      <SectionHeading
        eyebrow={site.booking.eyebrow}
        title={site.booking.title}
        subtitle={site.booking.subtitle}
      />
      <Reveal className="mx-auto mt-10 max-w-3xl">
        <div
          ref={ref}
          className="overflow-hidden rounded-2xl border border-border"
          style={{ minWidth: 320, height: 700 }}
        />
      </Reveal>
    </Section>
  );
}
