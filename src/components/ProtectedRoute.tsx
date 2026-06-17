import { useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { brand } from "@/config/brand";
import { useAuth } from "@/hooks/useAuth";
import { useAccess, type AccessTier } from "@/hooks/useAccess";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  /** 'stakeholder' admits admins too; 'admin' is operator-only. */
  tier?: AccessTier;
  children: ReactNode;
}

/**
 * Guard for the app. Renders an inline access-denied card on failure rather
 * than redirecting, so a signed-in-but-unauthorized user has a way out
 * (sign in with a different account).
 */
export function ProtectedRoute({ tier = "stakeholder", children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isStakeholder, isLoading } = useAccess();

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const allowed = tier === "admin" ? isAdmin : isAdmin || isStakeholder;
  if (!allowed) return <AccessDenied />;

  return <>{children}</>;
}

function AccessDenied() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const switchAccount = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-card-lg">
        <h1 className="mb-2 text-xl font-bold text-card-foreground">
          {brand.productName} — access required
        </h1>
        <p className="mb-2 text-sm text-muted-foreground">
          This deck is provisioned per account. If you believe you should have
          access, ask your {brand.tiers.admin} to grant it.
        </p>
        {user?.email && (
          <p className="mb-6 text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="font-semibold text-foreground">{user.email}</span>
          </p>
        )}
        <Button onClick={switchAccount} disabled={signingOut} className="w-full">
          {signingOut ? "Signing out…" : "Sign in with a different account"}
        </Button>
      </div>
    </div>
  );
}
