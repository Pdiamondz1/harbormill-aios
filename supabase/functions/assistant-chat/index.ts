// assistant-chat (deck)
// Thin STREAMING transport over the shared Aria core (_shared/assistant-core.ts).
//
// - Caller must have a valid session AND an admin/stakeholder role row.
// - Owns ONLY auth + conversation resolution + transport; the core owns the turn
//   (persist user msg, history, tool loop, persist reply). It passes `send` as the
//   core's `emit`, so text + status events stream out as the turn runs.
// - Response is NDJSON (application/x-ndjson): one JSON object per line —
//   {type:"heartbeat"} | {type:"text",delta} | {type:"status",tool,label} |
//   {type:"done",content,actions} | {type:"error",message}.
//   This event union is the LIVE frontend contract (src/lib/aria/stream.ts) —
//   preserve every shape exactly.
// - Deployed with --no-verify-jwt (it verifies the caller's session itself).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { runAssistantTurn, MAX_INPUT_LENGTH } from "../_shared/assistant-core.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

  // ── Auth: validate the caller's session and resolve the user ──
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const userId = userData.user.id;

  // Require an access-tier role (admin or stakeholder).
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roleList = (roles ?? []) as { role: string }[];
  const isAdmin = roleList.some((r) => r.role === "admin");
  const hasAccess = isAdmin || roleList.some((r) => r.role === "stakeholder");
  if (!hasAccess) return json({ error: "forbidden: no access tier" }, 403);

  let conversation_id: string;
  let message: string;
  try {
    const body = await req.json();
    conversation_id = body.conversation_id;
    message = body.message;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  // Validate BEFORE opening the stream — the frontend's `if (!resp.ok)` path
  // expects a real 400 JSON, not a 200 NDJSON error event. MAX_INPUT_LENGTH is
  // imported from the core so the pre-check and the core's guard never drift.
  if (!conversation_id || typeof message !== "string" || !message.trim()) {
    return json({ error: "conversation_id and message are required" }, 400);
  }
  if (message.length > MAX_INPUT_LENGTH) {
    return json({ error: `Message too long (max ${MAX_INPUT_LENGTH} chars)` }, 400);
  }

  // Conversation ownership.
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversation_id)
    .maybeSingle();
  if (!conv || conv.user_id !== userId) return json({ error: "forbidden: not your conversation" }, 403);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (e: unknown) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      send({ type: "heartbeat" }); // flush the first byte immediately
      const heartbeat = setInterval(() => { if (!closed) send({ type: "heartbeat" }); }, 15_000);
      try {
        // The core streams text + status events out through `send`.
        const { content, actions } = await runAssistantTurn(
          supabase,
          {
            userId,
            conversationId: conversation_id,
            message,
            isAdmin,
            edgeFunction: "assistant-chat",
          },
          send,
        );
        // Actions ride on `done` — there is no standalone actions event.
        send({ type: "done", content, actions: actions ?? [] });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Internal error";
        console.error("[assistant-chat]", msg);
        send({ type: "error", message: msg });
      } finally {
        closed = true;
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders(req), "Content-Type": "application/x-ndjson" },
  });
});
