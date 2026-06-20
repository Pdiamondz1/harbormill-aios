import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { CONNECTORS } from "../_shared/connectors/registry.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ConnectorRow {
  id: string; type: string; name: string; config: Record<string, unknown>;
}

async function ingestMetrics(metrics: unknown[]): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/report-ingest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metrics", payload: { metrics } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `report-ingest ${res.status}`);
  return body.inserted ?? metrics.length;
}

// deno-lint-ignore no-explicit-any
async function runConnector(supabase: any, row: ConnectorRow) {
  const connector = CONNECTORS[row.type];
  if (!connector) throw new Error(`unknown connector type '${row.type}'`);
  const metrics = await connector.pull({ config: row.config ?? {}, env: Deno.env.toObject() });
  const keys = metrics.map((m) => m.key);

  let inserted = 0;
  if (metrics.length > 0) inserted = await ingestMetrics(metrics);

  const nextRun = new Date(Date.now() + 3600 * 1000).toISOString(); // v1: +1h
  await supabase.from("connectors").update({
    last_status: "ok", last_run_at: new Date().toISOString(),
    last_error: null, last_result: { inserted, keys }, next_run_at: nextRun,
  }).eq("id", row.id);
  return { id: row.id, status: "ok", inserted };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Mode A: trusted cron (exact service-role match) -> all enabled + due connectors.
  const isService = authHeader === `Bearer ${SERVICE_ROLE_KEY}`;

  let connectorId: string | undefined;
  if (!isService) {
    // Mode B: admin user JWT -> on-demand single connector.
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) return json({ error: "forbidden: admin only" }, 403);
    const body = await req.json().catch(() => ({}));
    connectorId = body?.connector_id;
    if (!connectorId) return json({ error: "connector_id is required" }, 400);
  }

  // Load target connectors.
  let query = supabase.from("connectors").select("id, type, name, config").eq("enabled", true);
  if (connectorId) {
    query = supabase.from("connectors").select("id, type, name, config").eq("id", connectorId);
  } else {
    query = query.or(`next_run_at.is.null,next_run_at.lte.${new Date().toISOString()}`);
  }
  const { data: rows, error } = await query;
  if (error) return json({ error: error.message }, 500);

  const results: unknown[] = [];
  for (const row of (rows ?? []) as ConnectorRow[]) {
    try {
      results.push(await runConnector(supabase, row));
    } catch (err) {
      const message = err instanceof Error ? err.message : "sync failed";
      console.error(`[connector-sync] ${row.id}:`, message);
      await supabase.from("connectors").update({
        last_status: "error", last_run_at: new Date().toISOString(), last_error: message,
      }).eq("id", row.id);
      results.push({ id: row.id, status: "error", error: message });
    }
  }
  return json({ success: true, results });
});
