import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { CalendlyButton } from "@/components/CalendlyButton";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-xl"
          : "border-b border-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5" aria-label={site.company.name}>
          <img src="/logo-mark.png" alt="" className="h-8 w-auto" />
          <span className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-foreground">
              Harbormill
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Automation
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {site.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <CalendlyButton size="sm">Book a free intro</CalendlyButton>
        </nav>

        <button
          className="text-foreground md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <CalendlyButton className="mt-2 w-full" onClick={() => setOpen(false)}>
              Book a free 30-min intro
            </CalendlyButton>
          </nav>
        </div>
      )}
    </header>
  );
}
