import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { brand } from "@/config/brand";
import { features, type FeatureKey } from "@/config/features";
import { useAuth } from "@/hooks/useAuth";
import { useAccess } from "@/hooks/useAccess";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AriaProvider } from "@/contexts/AriaProvider";
import { AriaPanel } from "@/components/assistant/AriaPanel";
import { AriaLauncher } from "@/components/assistant/AriaLauncher";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  /** When true, only the admin tier sees this item. */
  adminOnly?: boolean;
  /** When set, the item shows only if this feature flag is enabled. */
  feature?: FeatureKey;
}

const NAV: NavItem[] = [
  { to: "/", label: "Overview", end: true },
  { to: "/projects", label: "Projects", feature: "projects" },
  { to: "/calendar", label: "Calendar", feature: "calendar" },
  { to: "/value", label: "Value", feature: "value" },
  { to: "/audits", label: "Audits", adminOnly: true, feature: "audits" },
  { to: "/briefings", label: "Briefings", feature: "briefings" },
  { to: "/findings", label: "Findings", adminOnly: true, feature: "findings" },
  { to: "/strategy", label: "Strategy", feature: "strategy" },
  { to: "/workspace", label: "Workspace", feature: "workspace" },
  { to: "/assistant", label: brand.assistantName, feature: "assistant" },
];

export function AppLayout() {
  const { isAdmin } = useAccess();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV.filter(
    (item) => (isAdmin || !item.adminOnly) && (!item.feature || features[item.feature])
  );

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      navigate("/auth", { replace: true });
    }
  };

  return (
    <AriaProvider>
    <div className="relative min-h-screen bg-background">
      {/* Atmosphere: primary glow top-left, secondary ember bottom-right, blueprint grid */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-secondary/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <header className="relative z-10 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-md lg:px-8">
        <div className="flex items-center gap-x-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <img src={brand.logoSrc} alt={brand.productName} className="h-8 w-auto" />
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden flex-wrap items-center gap-1 lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-xs text-muted-foreground lg:inline">
                {user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
              className="hidden lg:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5" />
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-lg p-2 text-foreground hover:bg-accent lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="mt-3 flex flex-col gap-1 lg:hidden" aria-label="Primary mobile">
            {navItems.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={() => setMobileOpen(false)} />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
              className="mt-2 justify-start"
            >
              <LogOut className="h-3.5 w-3.5" />
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </nav>
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl p-4 lg:p-8">
        <Outlet />
      </main>

      <AriaLauncher />
      <AriaPanel />
    </div>
    </AriaProvider>
  );
}

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )
      }
    >
      {item.label}
    </NavLink>
  );
}
