// report-ingest
// The single audited choke point through which scheduled agents (and Aria) write
// to the operating deck. Report-only autonomy is structural: this function can
// write metric, briefing, finding, and correction-proposal rows — nothing else.
//
// - Service-role only (exact bearer match).
// - Metrics: append-only snapshots (the Overview reads the latest per key).
// - Briefings: upsert on week_start. publish=true publishes; false unpublishes;
//   omitted leaves the existing publish state untouched.
// - Findings: upsert on fingerprint; occurrences bump, and a recurrence of a
//   RESOLVED finding reopens it (regression signal).
// - Corrections: Aria proposes a fix to a dashboard_setting or document; the
//   before-value is captured server-side and a 'proposed' row is queued for an
//   admin to approve via aios_corrections_apply().
// - Value: quantified value events (hours saved / revenue captured / cost avoided)
//   pushed by connectors or automations; feeds the ROI ("value delivered") surface.
//
// Request bodies:
//   { type: "metrics",  payload: { metrics: [{ key, label, value, unit?, target?, status?, captured_at? }] } }
//   { type: "briefing", payload: { week_start: "YYYY-MM-DD", title, body_md,
//       kpis?: [{ key, label, value, target?, status? }], generated_by?, publish?: boolean } }
//   { type: "findings", payload: { findings: [{ severity, title, summary_md, evidence?, source?, fingerprint? }] } }
//   ("metric"/"finding" with a single object are also accepted.)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SEVERITIES = new Set(["critical", "high", "medium", "low"]);
const METRIC_STATUSES = new Set(["on_track", "at_risk", "off_track"]);
const VALUE_CATEGORIES = new Set(["hours_saved", "revenue_captured", "cost_avoided", "other"]);
const INVOICE_STATUSES = new Set(["open", "paid", "written_off"]);

interface MetricPayload {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  target?: string;
  status?: string;
  captured_at?: string;
}

interface BriefingPayload {
  week_start: string;
  title: string;
  body_md: string;
  kpis?: Array<Record<string, unknown>>;
  generated_by?: string;
  publish?: boolean;
}

interface FindingPayload {
  severity: string;
  title: string;
  summary_md: string;
  evidence?: Record<string, unknown>;
  source?: string;
  fingerprint?: string;
}

interface InvoicePayload {
  external_id: string;
  customer_name: string;
  amount_cents: number;
  due_date: string;
  status?: string;
  customer_email?: string;
}

function validateMetric(m: unknown): string | null {
  const x = m as MetricPayload;
  if (!x || typeof x !== "object") return "metric must be an object";
  if (typeof x.key !== "string" || !x.key.trim()) return "metric.key is required";
  if (typeof x.label !== "string" || !x.label.trim()) return "metric.label is required";
  if (x.value === undefined || x.value === null) return "metric.value is required";
  if (x.status !== undefined && !METRIC_STATUSES.has(x.status))
    return `metric.status must be one of ${[...METRIC_STATUSES].join("|")}`;
  return null;
}

function validateFinding(f: unknown): string | null {
  const x = f as FindingPayload;
  if (!x || typeof x !== "object") return "finding must be an object";
  if (!SEVERITIES.has(x.severity)) return `severity must be one of ${[...SEVERITIES].join("|")}`;
  if (typeof x.title !== "string" || !x.title.trim()) return "title is required";
  if (typeof x.summary_md !== "string" || !x.summary_md.trim()) return "summary_md is required";
  if (x.fingerprint !== undefined && typeof x.fingerprint !== "string")
    return "fingerprint must be a string";
  return null;
}

function validateInvoice(i: unknown): string | null {
  const x = i as InvoicePayload;
  if (!x || typeof x !== "object") return "invoice must be an object";
  if (typeof x.external_id !== "string" || !x.external_id.trim()) return "invoice.external_id is required";
  if (typeof x.customer_name !== "string" || !x.customer_name.trim()) return "invoice.customer_name is required";
  if (typeof x.amount_cents !== "number" || !Number.isFinite(x.amount_cents) || x.amount_cents < 0) {
    return "invoice.amount_cents must be a number >= 0";
  }
  if (typeof x.due_date !== "string" || !x.due_date.trim()) return "invoice.due_date is required";
  if (x.status !== undefined && !INVOICE_STATUSES.has(x.status))
    return `invoice.status must be one of ${[...INVOICE_STATUSES].join("|")}`;
  if (x.customer_email !== undefined && typeof x.customer_email !== "string")
    return "invoice.customer_email must be a string";
  return null;
}

// deno-lint-ignore no-explicit-any
async function upsertFinding(supabase: any, f: FindingPayload): Promise<string> {
  const row = {
    severity: f.severity,
    title: f.title.trim(),
    summary_md: f.summary_md,
    evidence: f.evidence ?? {},
    source: f.source ?? "sweep-agent",
  };

  if (!f.fingerprint) {
    const { error } = await supabase.from("findings").insert(row);
    if (error) throw error;
    return "inserted";
  }

  const { data: existing, error: selectError } = await supabase
    .from("findings")
    .select("id, status, occurrences")
    .eq("fingerprint", f.fingerprint)
    .maybeSingle();
  if (selectError) throw selectError;

  if (!existing) {
    const { error } = await supabase.from("findings").insert({ ...row, fingerprint: f.fingerprint });
    if (error) throw error;
    return "inserted";
  }

  const reopen = existing.status === "resolved";
  const { error } = await supabase
    .from("findings")
    .update({
      ...row,
      occurrences: (existing.occurrences ?? 1) + 1,
      last_seen_at: new Date().toISOString(),
      ...(reopen ? { status: "open" } : {}),
    })
    .eq("id", existing.id);
  if (error) throw error;
  return reopen ? "reopened" : "updated";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  // Service role only — exact match (prevents substring bypass).
  if (req.headers.get("Authorization") !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  let type: string;
  // deno-lint-ignore no-explicit-any
  let rawPayload: any;
  try {
    const body = await req.json();
    type = body.type;
    rawPayload = body.payload;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!rawPayload || typeof rawPayload !== "object") {
    return json({ error: "payload is required" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Metrics (single or batch) ──
  if (type === "metric" || type === "metrics") {
    const metrics: unknown[] =
      type === "metric" ? [rawPayload] : Array.isArray(rawPayload.metrics) ? rawPayload.metrics : [];
    if (metrics.length === 0) return json({ error: "payload.metrics must be a non-empty array" }, 400);
    if (metrics.length > 100) return json({ error: "max 100 metrics per request" }, 400);
    for (const m of metrics) {
      const problem = validateMetric(m);
      if (problem) return json({ error: problem }, 400);
    }
    const rows = (metrics as MetricPayload[]).map((m) => ({
      key: m.key.trim(),
      label: m.label.trim(),
      value: String(m.value),
      unit: m.unit ?? null,
      target: m.target ?? null,
      status: m.status ?? null,
      captured_at: m.captured_at ?? new Date().toISOString(),
    }));
    const { error } = await supabase.from("metric_snapshots").insert(rows);
    if (error) {
      console.error("[report-ingest] metrics:", error.message);
      return json({ error: error.message }, 500);
    }
    return json({ success: true, inserted: rows.length });
  }

  // ── Findings (single or batch) ──
  if (type === "finding" || type === "findings") {
    const findings: unknown[] =
      type === "finding" ? [rawPayload] : Array.isArray(rawPayload.findings) ? rawPayload.findings : [];
    if (findings.length === 0) return json({ error: "payload.findings must be a non-empty array" }, 400);
    if (findings.length > 50) return json({ error: "max 50 findings per request" }, 400);
    for (const f of findings) {
      const problem = validateFinding(f);
      if (problem) return json({ error: problem }, 400);
    }
    const results = { inserted: 0, updated: 0, reopened: 0 };
    try {
      for (const f of findings) {
        const outcome = await upsertFinding(supabase, f as FindingPayload);
        results[outcome as keyof typeof results] += 1;
      }
      return json({ success: true, ...results });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ingest failed";
      console.error("[report-ingest] findings:", message);
      return json({ error: message, partial: results }, 500);
    }
  }

  // ── Correction proposal (from Aria via assistant-chat) ──
  // Aria PROPOSES; an admin approves at the corrections surface. We capture the
  // current value server-side (so the before/after diff can't be fabricated by
  // the model) and validate the target exists, then insert a 'proposed' row.
  if (type === "correction") {
    const p = rawPayload as {
      target_type?: string; target_ref?: string; title?: string;
      rationale_md?: string; proposed_value?: unknown;
      proposed_by?: string; acting_user_id?: string;
    };
    if (p.target_type !== "dashboard_setting" && p.target_type !== "document") {
      return json({ error: "target_type must be 'dashboard_setting' or 'document'" }, 400);
    }
    if (!p.target_ref || typeof p.target_ref !== "string") return json({ error: "target_ref is required" }, 400);
    if (!p.title || typeof p.title !== "string") return json({ error: "title is required" }, 400);
    if (!p.rationale_md || typeof p.rationale_md !== "string") return json({ error: "rationale_md is required" }, 400);
    if (p.proposed_value === undefined || p.proposed_value === null) return json({ error: "proposed_value is required" }, 400);

    let currentValue: unknown;
    if (p.target_type === "dashboard_setting") {
      const { data, error } = await supabase
        .from("aios_dashboard_settings").select("value").eq("key", p.target_ref).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: `unknown dashboard setting '${p.target_ref}'` }, 400);
      currentValue = data.value;
    } else {
      const { data, error } = await supabase
        .from("documents").select("content_md").eq("path", p.target_ref).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: `unknown document path '${p.target_ref}'` }, 400);
      currentValue = data.content_md;
    }

    try {
      const { data: inserted, error: insErr } = await supabase
        .from("aios_corrections")
        .insert({
          target_type: p.target_type,
          target_ref: p.target_ref,
          title: p.title.trim(),
          rationale_md: p.rationale_md,
          current_value: currentValue,
          proposed_value: p.proposed_value,
          proposed_by: p.proposed_by ?? "assistant",
          proposed_by_user: p.acting_user_id ?? null,
        })
        .select("id").single();
      if (insErr) throw insErr;
      return json({ success: true, id: inserted.id, status: "proposed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ingest failed";
      console.error("[report-ingest] correction:", message);
      return json({ error: message }, 500);
    }
  }

  // ── Value events (single or batch) ──
  // Quantified, attributed value the engagement delivered. Pushed by connectors /
  // automations (or entered by an admin in the UI). Feeds the ROI surface.
  if (type === "value" || type === "values") {
    const events: unknown[] =
      type === "value" && !Array.isArray(rawPayload.events) ? [rawPayload] : rawPayload.events;
    if (!Array.isArray(events) || events.length === 0) {
      return json({ error: "payload.events must be a non-empty array" }, 400);
    }
    if (events.length > 100) return json({ error: "max 100 value events per request" }, 400);

    const rows: Record<string, unknown>[] = [];
    for (const e of events) {
      const x = e as {
        category?: string; label?: string; amount_cents?: number;
        occurred_at?: string; source?: string; project_id?: string; metadata?: Record<string, unknown>;
        audit_opportunity_id?: string;
      };
      if (!x || typeof x !== "object") return json({ error: "value event must be an object" }, 400);
      if (!VALUE_CATEGORIES.has(x.category ?? "")) {
        return json({ error: `category must be one of ${[...VALUE_CATEGORIES].join("|")}` }, 400);
      }
      if (typeof x.label !== "string" || !x.label.trim()) return json({ error: "label is required" }, 400);
      if (typeof x.amount_cents !== "number" || !Number.isFinite(x.amount_cents) || x.amount_cents < 0) {
        return json({ error: "amount_cents must be a number >= 0" }, 400);
      }
      rows.push({
        category: x.category,
        label: x.label.trim(),
        amount_cents: Math.round(x.amount_cents),
        source: x.source ?? "agent",
        occurred_at: x.occurred_at ?? new Date().toISOString(),
        project_id: x.project_id ?? null,
        audit_opportunity_id: x.audit_opportunity_id ?? null,
        metadata: x.metadata ?? {},
      });
    }
    const { error } = await supabase.from("value_events").insert(rows);
    if (error) {
      console.error("[report-ingest] value:", error.message);
      return json({ error: error.message }, 500);
    }
    return json({ success: true, inserted: rows.length });
  }

  // ── Invoices (batch, upsert on external_id) ──
  // Vendor-neutral overdue-invoice store, fed by clients' accounting systems.
  // Upsert on external_id so re-pushes update status (open → paid / written_off).
  if (type === "invoices") {
    const invoices: unknown[] = Array.isArray(rawPayload.invoices) ? rawPayload.invoices : [];
    if (invoices.length === 0) return json({ error: "payload.invoices must be a non-empty array" }, 400);
    if (invoices.length > 100) return json({ error: "max 100 invoices per request" }, 400);
    for (const i of invoices) {
      const problem = validateInvoice(i);
      if (problem) return json({ error: problem }, 400);
    }
    const rows = (invoices as InvoicePayload[]).map((i) => ({
      external_id: i.external_id.trim(),
      customer_name: i.customer_name.trim(),
      amount_cents: Math.round(i.amount_cents),
      due_date: i.due_date,
      status: i.status ?? "open",
      customer_email: i.customer_email ?? null,
    }));
    const { error } = await supabase.from("ar_invoices").upsert(rows, { onConflict: "external_id" });
    if (error) {
      console.error("[report-ingest] invoices:", error.message);
      return json({ error: error.message }, 500);
    }
    return json({ success: true, inserted: rows.length });
  }

  // ── Briefing (single, upsert on week_start) ──
  if (type !== "briefing") {
    return json({ error: `Unsupported type "${type}" — use 'metrics', 'briefing', 'findings', 'correction', 'value', or 'invoices'` }, 400);
  }
  const payload = rawPayload as BriefingPayload;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.week_start ?? "")) {
    return json({ error: "payload.week_start must be YYYY-MM-DD" }, 400);
  }
  if (typeof payload.title !== "string" || !payload.title.trim()) {
    return json({ error: "payload.title is required" }, 400);
  }
  if (typeof payload.body_md !== "string" || !payload.body_md.trim()) {
    return json({ error: "payload.body_md is required" }, 400);
  }
  if (payload.kpis !== undefined && !Array.isArray(payload.kpis)) {
    return json({ error: "payload.kpis must be an array when provided" }, 400);
  }
  if (payload.publish !== undefined && typeof payload.publish !== "boolean") {
    return json({ error: "payload.publish must be a boolean when provided" }, 400);
  }

  const fields: Record<string, unknown> = {
    title: payload.title.trim(),
    body_md: payload.body_md,
    kpis: payload.kpis ?? [],
    generated_by: payload.generated_by ?? "weekly-brief-agent",
  };
  if (payload.publish !== undefined) {
    fields.published_at = payload.publish ? new Date().toISOString() : null;
  }

  try {
    const { data: existing, error: selectError } = await supabase
      .from("briefings")
      .select("id")
      .eq("week_start", payload.week_start)
      .maybeSingle();
    if (selectError) throw selectError;

    let id: string;
    if (existing) {
      const { error } = await supabase.from("briefings").update(fields).eq("id", existing.id);
      if (error) throw error;
      id = existing.id;
    } else {
      const { data: inserted, error } = await supabase
        .from("briefings")
        .insert({ week_start: payload.week_start, published_at: null, ...fields })
        .select("id")
        .single();
      if (error) throw error;
      id = inserted.id;
    }
    return json({ success: true, id, week_start: payload.week_start, updated: !!existing });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ingest failed";
    console.error("[report-ingest] briefing:", message);
    return json({ error: message }, 500);
  }
});
