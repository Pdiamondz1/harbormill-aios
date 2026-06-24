import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { runAssistantTurn, AssistantInputError } from "../_shared/assistant-core.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });

  // Auth: validate the caller's session and resolve the user.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const userId = userData.user.id;

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
  if (!conversation_id) return json({ error: "conversation_id and message are required" }, 400);

  const { data: conv } = await supabase
    .from("conversations").select("id, user_id").eq("id", conversation_id).maybeSingle();
  if (!conv || conv.user_id !== userId) return json({ error: "forbidden: not your conversation" }, 403);

  try {
    const { content } = await runAssistantTurn(supabase, {
      userId, conversationId: conversation_id, message, isAdmin, edgeFunction: "assistant-chat",
    });
    return json({ success: true, content });
  } catch (err) {
    if (err instanceof AssistantInputError) return json({ error: err.message }, 400);
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[assistant-chat]", msg);
    return json({ error: msg }, 500);
  }
});
