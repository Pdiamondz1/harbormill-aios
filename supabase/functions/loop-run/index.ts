// loop-run
// The Loop Engine's runner. Dual-mode, mirroring connector-sync:
//
//  - Mode A (cron tick): exact SUPABASE_SERVICE_ROLE_KEY bearer + empty/absent
//    body. Plans every enabled + due loop: queues proposed actions into
//    loop_actions and pushes loop metrics through report-ingest. Reschedules
//    each loop to now()+1h (fixed; schedule_cron is NOT parsed in v1).
//
//  - Mode B (approve / skip): admin user JWT + body { mode, action_id }. SKIP
//    marks a proposed action 'skipped'. APPROVE sends the reminder email via
//    google-workspace-proxy's gmail_send (using the CALLER's JWT so it sends
//    from the admin's connected Google account), then records the delivered
//    value event, stamps the AR invoice's last_reminded_at, and marks the
//    action 'sent'.
//
// Internal-call auth: report-ingest uses the service-role bearer (server-to-
// server); google-workspace-proxy's gmail_send uses the forwarded admin JWT
// (it is user-scoped).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { LOOPS } from "../_shared/loops/registry.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface LoopRow {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

interface LoopActionRow {
  id: string;
  status: string;
  target: Record<string, unknown>;
  payload: Record<string, unknown>;
  value_estimate_cents: number;
  value_category: string;
  audit_opportunity_id: string | null;
  metadata: Record<string, unknown>;
}

// POST quantified value events to report-ingest (service-role, server-to-server).
async function ingestValue(events: unknown[]): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/report-ingest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "value", payload: { events } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `report-ingest value ${res.status}`);
}

// POST loop metrics to report-ingest (service-role, server-to-server).
async function ingestMetrics(metrics: unknown[]): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/report-ingest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metrics", payload: { metrics } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `report-ingest metrics ${res.status}`);
  return body.inserted ?? metrics.length;
}

// Plan one loop: run its module, queue actions, push metrics, reschedule.
// deno-lint-ignore no-explicit-any
async function planLoop(supabase: any, loop: LoopRow) {
  const loopModule = LOOPS[loop.type];
  if (!loopModule) throw new Error(`unknown loop type '${loop.type}'`);

  const plan = await loopModule.plan({ supabase, config: loop.config ?? {} });

  let queued = 0;
  if (plan.actions.length > 0) {
    const rows = plan.actions.map((a) => ({
      loop_id: loop.id,
      type: a.type,
      target: a.target,
      payload: a.payload,
      value_estimate_cents: a.value_estimate_cents,
      value_category: a.value_category,
      audit_opportunity_id: a.audit_opportunity_id ?? null,
      metadata: a.metadata ?? {},
    }));
    const { error } = await supabase.from("loop_actions").insert(rows);
    if (error) throw error;
    queued = rows.length;
  }

  let metricsInserted = 0;
  if (plan.metrics.length > 0) metricsInserted = await ingestMetrics(plan.metrics);

  return { queued, metricsInserted };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), {
      status: s,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Mode detection: exact service-role bearer = trusted cron tick (Mode A);
  // anything else is treated as an admin-JWT approve/skip request (Mode B).
  const isService = authHeader === `Bearer ${SERVICE_ROLE_KEY}`;

  // ── Mode A: cron tick — plan all enabled + due loops ──
  if (isService) {
    const nowIso = new Date().toISOString();
    const { data: loops, error } = await supabase
      .from("loops")
      .select("id, type, config")
      .eq("enabled", true)
      .or(`next_run_at.is.null,next_run_at.lte.${nowIso}`);
    if (error) return json({ error: error.message }, 500);

    const results: unknown[] = [];
    let actionsQueued = 0;
    for (const loop of (loops ?? []) as LoopRow[]) {
      try {
        const { queued, metricsInserted } = await planLoop(supabase, loop);
        actionsQueued += queued;
        await supabase.from("loops").update({
          last_status: "ok",
          last_run_at: new Date().toISOString(),
          last_error: null,
          next_run_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }).eq("id", loop.id);
        results.push({ id: loop.id, type: loop.type, status: "ok", queued, metricsInserted });
      } catch (err) {
        const message = err instanceof Error ? err.message : "loop failed";
        console.error(`[loop-run] ${loop.id}:`, message);
        await supabase.from("loops").update({
          last_status: "error",
          last_run_at: new Date().toISOString(),
          last_error: message,
          next_run_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }).eq("id", loop.id);
        results.push({ id: loop.id, type: loop.type, status: "error", error: message });
      }
    }
    return json({ success: true, loops: results.length, actions_queued: actionsQueued, results });
  }

  // ── Mode B: admin-triggered approve / skip ──
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
  const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
  if (!isAdmin) return json({ error: "forbidden: admin only" }, 403);

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode as string | undefined;
  const actionId = body?.action_id as string | undefined;
  if (mode !== "approve" && mode !== "skip") {
    return json({ error: "mode must be 'approve' or 'skip'" }, 400);
  }
  if (!actionId) return json({ error: "action_id is required" }, 400);

  // ── Skip ──
  if (mode === "skip") {
    const { data: action, error: loadErr } = await supabase
      .from("loop_actions").select("id, status").eq("id", actionId).maybeSingle();
    if (loadErr) return json({ error: loadErr.message }, 500);
    if (!action) return json({ error: "action not found" }, 404);
    if (action.status !== "proposed") {
      return json({ error: `action is '${action.status}', not 'proposed'` }, 400);
    }
    const { error } = await supabase
      .from("loop_actions").update({ status: "skipped" }).eq("id", actionId);
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, id: actionId, status: "skipped" });
  }

  // ── Approve ──
  const { data: action, error: loadErr } = await supabase
    .from("loop_actions")
    .select("id, status, target, payload, value_estimate_cents, value_category, audit_opportunity_id, metadata")
    .eq("id", actionId)
    .maybeSingle();
  if (loadErr) return json({ error: loadErr.message }, 500);
  if (!action) return json({ error: "action not found" }, 404);
  if ((action as LoopActionRow).status !== "proposed") {
    return json({ error: `action is '${(action as LoopActionRow).status}', not 'proposed'` }, 400);
  }
  const a = action as LoopActionRow;
  const target = a.target ?? {};
  const payload = a.payload ?? {};

  // Send the email via google-workspace-proxy's gmail_send, forwarding the
  // CALLER's admin JWT so it sends from their connected Google account.
  let sendResult: unknown;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/google-workspace-proxy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "gmail_send",
        to: target.recipient,
        subject: payload.subject,
        body: payload.body_md,
      }),
    });
    const resBody = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(resBody?.error || `gmail_send ${res.status}`);
    sendResult = resBody;
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    console.error(`[loop-run] approve ${actionId}:`, message);
    await supabase.from("loop_actions")
      .update({ status: "failed", last_error: message }).eq("id", actionId);
    return json({ error: message, id: actionId, status: "failed" }, 500);
  }

  // On send success: record value, stamp the invoice, mark the action sent.
  try {
    await ingestValue([{
      category: a.value_category,
      label: "AR reminder: " + ((target.external_id as string) ?? ""),
      amount_cents: a.value_estimate_cents,
      source: "agent",
      audit_opportunity_id: a.audit_opportunity_id,
      metadata: a.metadata,
    }]);
  } catch (err) {
    // Email already sent — don't fail the request, but surface the issue.
    console.error(`[loop-run] approve ${actionId} value-ingest:`, err instanceof Error ? err.message : err);
  }

  if (target.invoice_id) {
    const { error: invErr } = await supabase
      .from("ar_invoices")
      .update({ last_reminded_at: new Date().toISOString() })
      .eq("id", target.invoice_id);
    if (invErr) console.error(`[loop-run] approve ${actionId} invoice-stamp:`, invErr.message);
  }

  const nowIso = new Date().toISOString();
  const { error: updErr } = await supabase.from("loop_actions").update({
    status: "sent",
    approved_by: userData.user.id,
    approved_at: nowIso,
    sent_at: nowIso,
  }).eq("id", actionId);
  if (updErr) return json({ error: updErr.message }, 500);

  return json({ success: true, id: actionId, status: "sent", send: sendResult });
});
