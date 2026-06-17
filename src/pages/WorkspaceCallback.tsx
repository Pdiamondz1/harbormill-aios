import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCompleteGoogleConnection } from "@/hooks/useGoogleWorkspace";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

/** Google OAuth redirect target. Register {APP_URL}/workspace/callback as the
 *  redirect URI in Google Cloud and as GOOGLE_REDIRECT_URI in function secrets. */
export default function WorkspaceCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const complete = useCompleteGoogleConnection();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(`Google returned an error: ${oauthError}`);
      return;
    }
    if (!code || !state) {
      setError("Missing authorization code or state.");
      return;
    }

    complete.mutate(
      { code, state },
      {
        onSuccess: () => navigate("/workspace", { replace: true }),
        onError: (e) => setError(e instanceof Error ? e.message : "Connection failed"),
      }
    );
  }, [params, complete, navigate]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      {error ? (
        <>
          <p className="text-sm font-semibold text-destructive-foreground">Couldn't connect Google</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button className="mt-5" variant="outline" onClick={() => navigate("/workspace", { replace: true })}>
            Back to Workspace
          </Button>
        </>
      ) : (
        <>
          <Spinner className="h-9 w-9" />
          <p className="mt-4 text-sm text-muted-foreground">Finishing the Google connection…</p>
        </>
      )}
    </div>
  );
}
