import { Mail, Linkedin } from "lucide-react";
import { site } from "@/config/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <img src="/logo-white.png" alt={site.company.name} className="h-16 w-auto" />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Practical AI automation for small business — taught first, then built. Reclaim the
              hours your busywork is taking.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-14">
            <nav className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Explore
              </p>
              {site.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Get in touch
              </p>
              <a
                href={`mailto:${site.company.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                {site.company.email}
              </a>
              <a
                href={site.founder.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
              <a
                href="#guide"
                className="text-sm text-primary transition-colors hover:text-primary/80"
              >
                Get the free AI guide →
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {year} {site.company.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
