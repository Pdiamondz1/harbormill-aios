# Aria in Google Chat — Bot Design

## Context

**Why this exists.** Aria (the AIOS assistant) today lives only inside the deck's Assistant page —
you have to open the web app to ask "what's overdue?" or "how are we tracking?". Damon wants to
reach Aria from **Google Chat** on any device, to pull deck/AIOS info without opening the deck.
Harbormill runs on Google Workspace, so a Google Chat app is available.

**What Aria already is.** `assistant-chat` (Deno edge function) runs a single-agent RAG loop over a
pluggable tool registry (`tools.ts`): authenticates the caller's JWT, requires an admin/stakeholder
role, inserts the user message, runs an Anthropic tool loop (max 8 rounds, `claude-sonnet-4-6`),
persists the reply, and returns a **single JSON** response `{ success, content }` (NOT streamed).
Tools execute server-side with the service role via `ToolContext { supabase, userId, openaiKey,
isAdmin }`. This is the brain we want to reach from Chat.

**Confirmed decisions (from brainstorming):**
- **Scope = read-only Q&A** for v1. Aria answers questions; no writes, no actions (no
  `create_finding`, `propose_correction`, `export_to_drive`, `compose_email_link`).
- **Just Damon.** A single hardcoded identity mapping (his Google Chat identity → his admin deck
  user). No account-link flow, no mapping table, no UI.
- **Google Workspace confirmed** (required for Chat apps).
- **Approach A — shared core.** Extract the chat loop into `_shared/assistant-core.ts`; both
  `assistant-chat` and the new webhook call it (DRY, no logic drift). The live deck Aria is the
  regression check after the refactor.
- **Per-thread conversations.** Each Google Chat thread maps to its own `conversations` row (new
  thread = fresh Aria context), via a new nullable `external_ref` column.

## Goal

Damon can DM the "Aria" app in Google Chat and get grounded, read-only answers from the AIOS —
metrics, the weekly briefing, value/ROI, and knowledge-base lookups — reusing Aria's existing brain,
with the webhook hardened so only Google Chat (and only Damon) can invoke it.

## Architecture

```
Damon (Google Chat)
   │  DMs the "Aria" app
   ▼
Google Chat  ──HTTP POST (event JSON + Bearer JWT signed by Google)──►
   ▼
supabase/functions/google-chat-webhook   (verify_jwt: false; does its own verification)
   ├─ 1. Verify the Google-signed Bearer JWT (authenticity gate)
   ├─ 2. Identity gate: sender email == ARIA_CHAT_ALLOWED_EMAIL → map to ARIA_CHAT_USER_ID
   ├─ 3. Find-or-create the conversation for this Chat thread (external_ref)
   ├─ 4. runAssistantTurn(...) with the READ-ONLY tool allowlist
   └─ 5. Return Google Chat message JSON: { text: "<Aria's answer>" }
            │
            ▼
   _shared/assistant-core.ts  ──►  same Anthropic tool loop the deck Aria uses
```

**Reused unchanged:** `tools.ts` (registry + `ToolContext`), `anthropic-fetch.ts`, `cost-ledger.ts`,
the `conversations`/`messages` tables, the system prompt and injection sanitisation (they move into
the shared core).

## Components & responsibilities

### 1. `supabase/functions/_shared/assistant-core.ts` (new — extracted from `assistant-chat`)

Exports one function that owns the **turn** (everything after auth + conversation resolution):

```ts
runAssistantTurn(supabase, {
  userId: string,
  conversationId: string,   // must already exist and be owned by userId (caller guarantees)
  message: string,
  isAdmin: boolean,
  toolAllowlist?: Set<string>,  // when set, only these tool names are exposed to Aria
}): Promise<{ content: string }>
```

Responsibilities (lifted verbatim from `assistant-chat/index.ts` lines ~178–278): sanitise the
message, persist the user message, load the last 40 turns, build the system prompt, select tools,
run the Anthropic tool loop (max 8 rounds), log cost, persist the assistant reply, bump
`last_message_at`, return the final text. The system prompt builder, `sanitize`, cache-breakpoint
helper, `extractText`, and the `anthropic()` wrapper move here too.

**Tool selection becomes:** existing filter (`isAdmin || !requiresAdmin`, minus `DISABLED_TOOLS`)
**AND**, when `toolAllowlist` is provided, `toolAllowlist.has(name)`. `assistant-chat` passes no
allowlist (unchanged behaviour); the webhook passes the read-only set.

### 2. `supabase/functions/assistant-chat/index.ts` (refactor — thin caller)

Keeps its JWT auth, role check, body parse, and conversation-ownership check, then calls
`runAssistantTurn(supabase, { userId, conversationId, message, isAdmin })` and returns
`{ success: true, content }`. Net effect: the loop body is deleted and replaced by one call. **The
deck Aria must behave identically** — this is the regression gate (re-verified live on Harbormill's
instance after deploy).

### 3. `supabase/functions/google-chat-webhook/index.ts` (new)

Deployed `--no-verify-jwt` (it verifies Google's JWT itself). Steps:

1. **Authenticity gate — verify the Google-signed Bearer JWT.** Google Chat sends
   `Authorization: Bearer <JWT>` signed by `chat@system.gserviceaccount.com`. Verify with `jose`
   (`createRemoteJWKSet` against Google's JWKS endpoint
   `https://www.googleapis.com/service_accounts/v1/jwk/chat@system.gserviceaccount.com`), asserting
   `issuer = chat@system.gserviceaccount.com` and `audience = ARIA_CHAT_PROJECT_NUMBER` (the Chat
   app's project number). Reject (401) on any failure. This stops anyone else POSTing to the URL.
2. **Parse the event.** Handle `type: "MESSAGE"` (answer) and `type: "ADDED_TO_SPACE"` (one-line
   greeting). Ignore others with an empty 200.
3. **Identity gate.** Require `message.sender.email === ARIA_CHAT_ALLOWED_EMAIL`. Anyone else →
   polite `{ text: "Sorry, I'm a private assistant and can't help here." }`. The allowed sender maps
   to `ARIA_CHAT_USER_ID` (his admin deck user); `isAdmin = true`.
4. **Resolve the conversation by thread.** Use `message.thread.name` as `external_ref`; look up
   `conversations` by `(user_id = ARIA_CHAT_USER_ID, external_ref)`; create the row if absent. (DMs
   without a thread fall back to a single stable `external_ref = space.name`.)
5. **Run the turn.** `runAssistantTurn(supabase, { userId: ARIA_CHAT_USER_ID, conversationId,
   message: message.text, isAdmin: true, toolAllowlist: READ_ONLY_TOOLS })`.
6. **Reply.** Return `{ text: content }` (Google Chat renders it). On error, return a friendly
   `{ text: "I hit an error pulling that — try again in a moment." }` and log server-side.

**`READ_ONLY_TOOLS`** (defined in the webhook): `search_knowledge`, `read_metrics`,
`get_latest_briefing`, `get_document`, `get_value_summary`, `get_weight_trend`, `get_cost_stats`.
Deliberately excludes every write/action tool and the Google-proxy tools (which need an interactive
user JWT that the webhook context doesn't have): `create_finding`, `propose_correction`,
`export_to_drive`, `list_drive_files`, `compose_email_link`.

### 4. Migration — `conversations.external_ref`

```sql
alter table public.conversations add column external_ref text;
create index idx_conversations_external_ref on public.conversations (user_id, external_ref)
  where external_ref is not null;
```

Nullable; deck-created conversations leave it null (unchanged). The webhook keys Chat threads on it.
RLS already scopes `conversations` by `user_id`; no policy change needed (the webhook uses the
service role anyway).

### 5. Config (edge-function secrets)

- `ARIA_CHAT_ALLOWED_EMAIL` = `dwilliams@harbormill.net` (the only sender allowed).
- `ARIA_CHAT_USER_ID` = Damon's admin `user_id` (UUID) on the target Supabase project.
- `ARIA_CHAT_PROJECT_NUMBER` = the Chat app's Google Cloud **project number** (JWT audience).

(`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` already exist on
the project.)

## Damon-executed setup (runbook the plan produces)

1. **Google Cloud → Google Chat API → Configuration:** app name "Aria", avatar + description,
   enable interactive features, **Connection settings = App URL** set to the deployed
   `google-chat-webhook` function URL, visibility limited to himself / the Harbormill org.
2. Note the **project number** → set `ARIA_CHAT_PROJECT_NUMBER`.
3. In Google Chat, **find and DM the "Aria" app**, ask a question.

## Data flow (one message)

1. Damon DMs Aria "what's overdue right now?".
2. Google Chat POSTs the MESSAGE event (+ signed JWT) to the webhook.
3. Webhook verifies the JWT, confirms the sender is Damon, finds/creates the thread's conversation.
4. `runAssistantTurn` runs the read-only loop → `read_metrics` (AR figures) → composes an answer.
5. Webhook returns `{ text: "..." }`; Google Chat shows Aria's reply in the DM.

## Error handling

- **Bad/absent Google JWT** → 401, no body leak.
- **Wrong sender** → 200 with a polite refusal (don't reveal internals).
- **Anthropic / tool error** → caught in the core (tool errors already become `{ error }` tool
  results); webhook returns a friendly text and logs the detail server-side.
- **Empty model output** → existing core fallback message is returned (renders fine in Chat).

## Testing

- **Unit (Vitest, `src/test/`):** pure helpers extracted where practical — e.g. an
  `isAllowedSender(email)` / `resolveThreadRef(event)` helper module under `_shared/` tested without
  network. The read-only allowlist is asserted to exclude every write/action tool name.
- **Deck-Aria regression:** after the `assistant-chat` refactor, re-run the existing manual deck
  smoke (ask Aria a metrics + a value question) on Harbormill's live instance — behaviour identical.
- **Webhook live smoke:** with the Chat app configured, DM Aria a metrics question and confirm a
  grounded reply; DM from a non-allowed account (or simulate) and confirm the refusal path.

## Out of scope (deliberate follow-ons)

- **Write/admin actions from Chat** (log a finding, queue a correction, send AR email).
- **Multi-user / account-linking** (mapping table + link flow + per-user identity).
- **Rich Chat cards, typing indicators, streaming, slash commands.**
- **Group-space support** (v1 is Damon's 1:1 DM).

## Verification (definition of done)

- `_shared/assistant-core.ts` exists; `assistant-chat` calls it; deck Aria behaves identically
  (live regression passes).
- `conversations.external_ref` migration applied (`list_migrations` shows it; `get_advisors`
  security shows no new issues).
- `google-chat-webhook` deployed ACTIVE (`--no-verify-jwt`).
- Vitest green for the allowlist + identity/thread helpers; full gate (`typecheck`/`lint`/`build`/
  `test`) green.
- Live: Damon DMs Aria and gets a correct, grounded, read-only answer; a non-allowed sender is
  refused; an unsigned POST is rejected 401.

## Notes

- Reuses the established pattern: edge function deployed `--no-verify-jwt` that self-authenticates
  (matches `report-ingest`, `loop-run`, `transcript-summarize`).
- The shared-core extraction is the kind of in-place improvement this work naturally motivates: two
  callers now share one well-tested loop instead of duplicating it.
- This webhook is reachable from the public internet; the Google-JWT + single-sender gates are the
  security boundary and must both pass before any tool runs.
