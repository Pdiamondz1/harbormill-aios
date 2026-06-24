// google-chat-webhook
// A read-only Google Chat front-end for Aria. Verifies Google's signed JWT,
// confirms the sender is the single allowed user, maps to that admin deck user,
// resolves a per-thread conversation, and runs a read-only Aria turn.
// Deployed with --no-verify-jwt (it verifies Google's JWT itself).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify, createRemoteJWKSet } from "https://esm.sh/jose@5";
import { runAssistantTurn } from "../_shared/assistant-core.ts";
import { READ_ONLY_TOOLS } from "../_shared/aria-chat-tools.ts";
import { parseChatEvent, isAllowedSender, type ChatEvent } from "../_shared/google-chat.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_EMAIL = Deno.env.get("ARIA_CHAT_ALLOWED_EMAIL") ?? "";
const CHAT_USER_ID = Deno.env.get("ARIA_CHAT_USER_ID") ?? "";
const PROJECT_NUMBER = Deno.env.get("ARIA_CHAT_PROJECT_NUMBER") ?? "";

const CHAT_ISSUER = "chat@system.gserviceaccount.com";
// Module-level so jose caches Google's keyset across invocations (do not rebuild per request).
const JWKS = createRemoteJWKSet(
  new URL(`https://www.googleapis.com/service_accounts/v1/jwk/${CHAT_ISSUER}`),
);

const text = (t: string) =>
  new Response(JSON.stringify({ text: t }), { headers: { "Content-Type": "application/json" } });
const REFUSAL = "Sorry, I'm a private assistant and can't help here.";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // 1. Authenticity gate: verify the Google-signed Bearer JWT.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return new Response("Unauthorized", { status: 401 });
  try {
    await jwtVerify(token, JWKS, { issuer: CHAT_ISSUER, audience: PROJECT_NUMBER });
  } catch (_err) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse the event.
  let event: ChatEvent;
  try {
    event = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const parsed = parseChatEvent(event);

  // 3. Identity gate (fail closed on missing email).
  if (!isAllowedSender(parsed.senderEmail, ALLOWED_EMAIL)) return text(REFUSAL);

  if (parsed.type === "ADDED_TO_SPACE") {
    return text(
      "Hi — I'm Aria. Ask me about your metrics, weekly brief, value delivered, or anything in the knowledge base.",
    );
  }
  if (parsed.type !== "MESSAGE" || !parsed.text) return new Response(null, { status: 200 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 4/5. Resolve the conversation for this Chat thread (create on first message).
  const externalRef = parsed.threadRef ?? "google-chat:default";
  let conversationId: string;
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", CHAT_USER_ID)
    .eq("external_ref", externalRef)
    .maybeSingle();
  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ user_id: CHAT_USER_ID, external_ref: externalRef })
      .select("id")
      .single();
    if (error || !created) {
      console.error("[google-chat-webhook] conversation create failed:", error?.message);
      return text("I hit an error pulling that — try again in a moment.");
    }
    conversationId = created.id;
  }

  // 6. Run the read-only turn.
  try {
    const { content } = await runAssistantTurn(supabase, {
      userId: CHAT_USER_ID,
      conversationId,
      message: parsed.text,
      isAdmin: true,
      edgeFunction: "google-chat-webhook",
      toolAllowlist: READ_ONLY_TOOLS,
    });
    return text(content);
  } catch (err) {
    console.error("[google-chat-webhook]", err instanceof Error ? err.message : err);
    return text("I hit an error pulling that — try again in a moment.");
  }
});
