// CORS for browser-facing edge functions.
//
// Per-client deploy: set ALLOWED_ORIGINS (comma-separated) as a function secret
// to lock responses to the client's own domain(s). When unset, the request
// origin is reflected (fine for local dev / single-tenant). Service-role
// endpoints (report-ingest) are server-to-server and don't rely on CORS.
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const corsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get("origin") ?? "";
  const allow =
    ALLOWED.length === 0 ? origin || "*" : ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
};
