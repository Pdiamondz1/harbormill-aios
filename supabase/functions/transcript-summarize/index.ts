// transcript-summarize
// Admin pastes a meeting transcript; Claude returns { summary_md, action_items[] }.
// The summary is written to `meeting_reports`, then the action items are filed as
// findings through the report-ingest seam (service-role only). Reuses existing infra:
// the anthropic-fetch wrapper, cost-ledger, the transcript prompt/parse helpers, and
// report-ingest's findings path.
//
// - Auth: admin user JWT (mirrors connector-sync mode B).
// - The summary is saved BEFORE the findings fan-out, so a findings failure never
//   loses the summary — it only surfaces as a warning in the response.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { logCost } from "../_shared/cost-ledger.ts";
import { anthropicFetch } from "../_shared/anthropic-fetch.ts";
import { buildTranscriptPrompt, parseTranscriptResult } from "../_shared/transcript.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";
const ANTHROPIC_MAX_TOKENS = Number(Deno.env.get("ANTHROPIC_MAX_TOKENS") ?? 4096);
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_TRANSCRIPT_CHARS = 100_000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

  // ── Auth: admin user JWT (mirrors connector-sync mode B) ──
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const adminId = userData.user.id;

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", adminId);
  const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
  if (!isAdmin) return json({ error: "forbidden: admin only" }, 403);

  // ── Input ──
  let title: string;
  let meeting_date: string;
  let transcript: string;
  try {
    const body = await req.json();
    title = body.title;
    meeting_date = body.meeting_date;
    transcript = body.transcript;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (typeof title !== "string" || !title.trim()) return json({ error: "title is required" }, 400);
  if (typeof meeting_date !== "string" || !meeting_date.trim()) {
    return json({ error: "meeting_date is required" }, 400);
  }
  if (typeof transcript !== "string" || !transcript.trim()) {
    return json({ error: "transcript is required" }, 400);
  }
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return json({ error: `transcript too long; max ${MAX_TRANSCRIPT_CHARS} chars` }, 400);
  }

  // ── Claude call ──
  let result: { summary_md: string; action_items: Array<{ severity: string; title: string; summary_md: string }> };
  try {
    const resp = await anthropicFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: ANTHROPIC_MAX_TOKENS,
        messages: [{ role: "user", content: buildTranscriptPrompt(transcript) }],
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[transcript-summarize] anthropic:", resp.status, errText);
      return json({ error: `Anthropic error: ${resp.status} ${errText}` }, 502);
    }
    const data = await resp.json();
    const text: string = data.content?.[0]?.text ?? "";

    // Cost (best-effort, matches assistant-chat's logCost shape).
    await logCost(supabase, {
      userId: adminId,
      edgeFunction: "transcript-summarize",
      model: ANTHROPIC_MODEL,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    });

    try {
      result = parseTranscriptResult(text);
    } catch {
      return json({ error: "model returned unparseable output" }, 502);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "anthropic call failed";
    console.error("[transcript-summarize]", msg);
    return json({ error: msg }, 502);
  }

  // ── Insert summary (saved before findings fan-out) ──
  const { data: inserted, error: insErr } = await supabase
    .from("meeting_reports")
    .insert({
      title: title.trim(),
      meeting_date,
      summary_md: result.summary_md,
      transcript_chars: transcript.length,
      action_item_count: result.action_items.length,
      source: "manual",
      created_by: adminId,
    })
    .select("id")
    .single();
  if (insErr || !inserted) {
    const msg = insErr?.message ?? "failed to save meeting report";
    console.error("[transcript-summarize] insert:", msg);
    return json({ error: msg }, 500);
  }
  const report_id: string = inserted.id;

  // ── Fan action items into findings via report-ingest (SERVICE key, not the admin JWT) ──
  let warning: string | undefined;
  if (result.action_items.length > 0) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/report-ingest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "findings",
          payload: {
            findings: result.action_items.map((a, i) => ({
              severity: a.severity,
              title: a.title,
              summary_md: a.summary_md,
              source: "transcript-agent",
              fingerprint: `meeting:${report_id}:${i}`,
              evidence: { meeting_report_id: report_id },
            })),
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        warning = `findings ingest failed: ${body?.error || res.status}`;
        console.error("[transcript-summarize]", warning);
      }
    } catch (err) {
      warning = `findings ingest failed: ${err instanceof Error ? err.message : "request error"}`;
      console.error("[transcript-summarize]", warning);
    }
  }

  return json({
    meeting_report_id: report_id,
    action_item_count: result.action_items.length,
    ...(warning ? { warning } : {}),
  });
});
