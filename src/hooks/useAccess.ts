import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Access tiers. `admin` is the operator; `stakeholder` is the view-only tier. */
export type AccessTier = "admin" | "stakeholder";

/**
 * Resolves the current user's access from their own `user_roles` rows
 * (gated by a self-select RLS policy). Access is provisioned out-of-band —
 * there is no self-service signup.
 */
export function useAccess() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["access", user?.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) {
        console.error("Failed to load access roles:", error);
        return { isAdmin: false, isStakeholder: false };
      }
      const roles = (rows ?? []).map((r: { role: string }) => r.role);
      return {
        isAdmin: roles.includes("admin"),
        isStakeholder: roles.includes("stakeholder"),
      };
    },
    enabled: !!user,
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    isStakeholder: data?.isStakeholder ?? false,
    isLoading: authLoading || (!!user && isLoading),
  };
}
