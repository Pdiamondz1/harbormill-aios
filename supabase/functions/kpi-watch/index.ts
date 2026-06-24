// kpi-watch
// Scheduled, unattended, deterministic KPI-watch loop (no LLM). Reads metric_latest,
// derives breach findings for any KPI whose status != on_track, and upserts them via the
// report-ingest service-role seam (fingerprint -> idempotent + reopen-on-recurrence).
// Invoked by a daily pg_cron job with the service-role bearer (mirrors connector-sync).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { deriveBreachFindings, type MetricRow } from "./derive.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const INGEST_BATCH = 50; // report-ingest caps findings at 50 per request

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  // Service-role only — exact match (mirrors report-ingest; prevents substring bypass).
  if (req.headers.get("Authorization") !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from("metric_latest")
    .select("key, label, value, unit, target, status, captured_at");
  if (error) {
    console.error("[kpi-watch] read metric_latest:", error.message);
    return json({ error: error.message }, 500);
  }

  const metrics = (data ?? []) as MetricRow[];
  const findings = deriveBreachFindings(metrics);

  if (findings.length === 0) {
    return json({ checked: metrics.length, breaching: 0, upserted: 0 });
  }

  let upserted = 0;
  for (let i = 0; i < findings.length; i += INGEST_BATCH) {
    const batch = findings.slice(i, i + INGEST_BATCH);
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/report-ingest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "findings", payload: { findings: batch } }),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error("[kpi-watch] report-ingest:", resp.status, detail);
      return json({ error: `report-ingest failed (${resp.status})`, upserted }, 502);
    }
    upserted += batch.length;
  }

  return json({ checked: metrics.length, breaching: findings.length, upserted });
});
