# Extending the deck

Three common extensions. All follow the template's grain: data flows in through the
service-role ingest seam, and the assistant gains capability through its tool registry.

## Add an AI tool

Tools live in `supabase/functions/assistant-chat/tools.ts` as a registry array. Append one:

```ts
{
  definition: {
    name: "get_open_tickets",
    description: "Return the count of open support tickets. Use for support-load questions.",
    input_schema: { type: "object", properties: {} },
  },
  execute: async (_args, ctx) => {
    const { data, error } = await ctx.supabase.from("metric_latest").select("value").eq("key", "tickets_open").maybeSingle();
    if (error) throw error;
    return { open_tickets: data?.value ?? "unknown" };
  },
},
```

`ctx` gives you `{ supabase (service role), userId, openaiKey }`. Redeploy with
`supabase functions deploy assistant-chat`. The model decides when to call it from the
`description` — write that carefully.

## Add a metric source

Metrics are append-only snapshots pushed through `report-ingest`. No schema change needed —
just push new keys. Have the client's job POST:

```json
{ "type": "metrics", "payload": { "metrics": [
  { "key": "arr", "label": "ARR", "value": "$1.2M", "target": "$1.5M", "status": "at_risk" }
] } }
```

The Overview renders the latest snapshot per key automatically. `status` is one of
`on_track` | `at_risk` | `off_track` and drives the card's accent color.

## Feed the knowledge base

The assistant answers from `public.knowledge`. Push documents to `knowledge-sync` (service role):

```json
{ "items": [
  { "source_id": "doc:strategy/positioning", "content": "<full markdown>", "metadata": { "title": "Positioning" } }
] }
```

To sync the whole `documents` table, read its rows and map each to
`{ source_id: "doc:" + path, content: content_md, metadata: { title, path, tags } }`.
Re-syncing the same `source_id` updates in place (idempotent).

## Add a page

1. Create `src/pages/Thing.tsx` (use `PageHeader` + `EmptyState` for consistency).
2. Add a `<Route path="thing" element={<Thing />} />` inside the protected layout in `src/App.tsx`.
3. Add a nav entry to the `NAV` array in `src/components/layout/AppLayout.tsx`
   (set `adminOnly: true` to hide it from stakeholders).
