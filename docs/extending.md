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

## Add a connector

Connectors pull live data from external SaaS into `metric_snapshots` on a schedule.
Stripe is the reference connector. Adding GA4, Google Sheets, or any other source
follows these four steps.

**1. Write the connector module** in `supabase/functions/_shared/connectors/`
implementing the `Connector` interface (`types.ts`):

```ts
// supabase/functions/_shared/connectors/ga4.ts
import type { Connector, ConnectorContext, PulledMetric } from "./types.ts";
import { mapGa4, type Ga4MapConfig } from "./ga4-map.ts";   // pure mapping fn

const SECRET_ENV = "CONNECTOR_GA4_SECRET_KEY";

export const ga4Connector: Connector = {
  type: "ga4",
  secretEnvVar: SECRET_ENV,
  async pull(ctx: ConnectorContext): Promise<PulledMetric[]> {
    const key = ctx.env[SECRET_ENV];
    if (!key) throw new Error(`missing ${SECRET_ENV}`);
    // ... fetch from GA4 API ...
    return mapGa4(raw, ctx.config as Ga4MapConfig);
  },
};
```

Keep the response→metric transform in a separate file (`ga4-map.ts`) with no
imports so it can be unit-tested with Vitest without any network I/O —
the same pattern `stripe-map.ts` follows for `mapStripe`.

**2. Register it** in `supabase/functions/_shared/connectors/registry.ts`:

```ts
import { ga4Connector } from "./ga4.ts";

export const CONNECTORS: Record<string, Connector> = {
  stripe: stripeConnector,
  ga4: ga4Connector,    // add one line
};
```

**3. Extend the `type` CHECK constraint** via a new migration:

```sql
-- supabase/migrations/20260618000000_connector_add_ga4.sql
alter table public.connectors
  drop constraint connectors_type_check,
  add constraint connectors_type_check check (type in ('stripe', 'ga4'));
```

Each new connector type requires one `alter table` migration so the `connectors`
table accepts the new `type` value.

**4. Set the secret** as a Supabase edge-function secret (never stored in the DB):

```bash
supabase secrets set CONNECTOR_GA4_SECRET_KEY=<your-key>
```

The env var name must match `secretEnvVar` on your module. The admin Connectors
page will surface an `error` status with the missing-env message until the secret
is set, so failures are visible and never silent.

The `connector-sync` edge function handles scheduling (hourly via pg_cron) and
on-demand "Sync now" automatically — no changes needed there. All metrics flow
through the existing [[report-ingest]] seam, never through a second write path.

> **Stripe emits metrics only.** Stripe data (MRR, subscriptions, new customers)
> maps to `metric_snapshots`, not `value_events`. Raw client revenue is not value
> Harbormill delivered; conflating them would inflate the ROI surface. The
> framework is value-capable, but the Stripe connector is intentionally
> metrics-only to keep the Value Delivered / ROI ledger honest.
