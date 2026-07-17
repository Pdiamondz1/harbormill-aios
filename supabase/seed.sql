-- Demo seed so a fresh clone renders a live-looking deck before a client wires
-- their own agents. Safe to delete. Runs as the service role on `supabase db reset`.
--
-- The demo portrays ONE coherent business: **Meridian Field Services**, a
-- commercial HVAC & facilities-maintenance contractor (~$4M revenue, ~28 staff)
-- serving commercial property managers. Every surface — metrics, weekly brief,
-- findings, AR invoices, the meeting report, and value delivered — tells that
-- single story so a sales demo reads as one believable operator, with the AR
-- follow-up automation (the flagship hook) front and center.

-- Demo retainer = $5,000/mo — the published **Operate + Build** tier
-- (`docs/gtm/retainer-tiers.md`). Never show a demo priced at a tier we don't
-- sell: this was $2,500/mo to match an early AIOS Outcome Edition draft, but
-- that number is dead (it sat *below* the $3,000 Operate floor) and the offer
-- is now $10K + Embedded. See `docs/PROJECT_CONTEXT.md` §8 — canon for prices.
insert into public.aios_dashboard_settings (key, value) values
  ('monthly_retainer_cents', '500000'::jsonb)
on conflict (key) do update set value = excluded.value;

insert into public.metric_snapshots (key, label, value, unit, target, status) values
  ('revenue_mtd',  'Revenue (MTD)',        '$312,000', null,  '$350,000', 'at_risk'),
  ('active_jobs',  'Active jobs',          '24',       null,  null,       'on_track'),
  ('ar_days',      'Avg days to pay',      '41',       'days','< 35',     'off_track'),
  ('crew_util',    'Crew utilization',     '82',       '%',   '85%',      'at_risk'),
  ('csat',         'CSAT',                 '4.7',      '★',   '4.5',      'on_track'),
  ('callbacks',    'Callback rate (30d)',  '2.1',      '%',   '< 3%',     'on_track'),
  ('pipeline',     'Pipeline (bids out)',  '$480k',    null,  null,       'on_track'),
  ('repeat_rate',  'Repeat customer rate', '68',       '%',   '65%',      'on_track');

insert into public.briefings (week_start, title, body_md, kpis, generated_by, published_at) values
  (
    date_trunc('week', now())::date,
    'Weekly operating brief',
    E'## Where we stand\n\nRevenue is tracking under target while the work is there — the gap is cash timing, not demand. Two items need attention this week.\n\n### Highlights\n- **24 active jobs** on the board, with pipeline healthy at $480k in bids out.\n- **CSAT** held at 4.7★ and repeat-customer rate is 68%.\n\n### Watch\n- **Avg days-to-pay climbed to 41** (target < 35). Two commercial accounts — Lakeside and Gateway — are now well past due, **$20,950 combined**. Follow-up has been manual and inconsistent.\n- **Crew utilization** dipped to 82% with install overtime creeping up.\n\n### Recommended focus\n1. Get the two overdue invoices into automated follow-up before they age past 60 days.\n2. Quote the repeat rooftop-unit fault at Gateway — bundle it into a maintenance contract.',
    '[{"key":"revenue_mtd","label":"Revenue (MTD)","value":"$312,000","target":"$350,000","status":"at_risk"},{"key":"ar_days","label":"Avg days to pay","value":"41","target":"<35","status":"off_track"},{"key":"csat","label":"CSAT","value":"4.7","target":"4.5","status":"on_track"}]'::jsonb,
    'weekly-brief-agent',
    now()
  ),
  (
    (date_trunc('week', now()) - interval '7 days')::date,
    'Weekly operating brief',
    E'## Last week\n\nSolid week on the board. Closed three service contracts and rolled out the new preventive-maintenance schedule.\n\n### Highlights\n- Three new commercial service contracts signed.\n- PM schedule live for the top 12 accounts.\n\n### Watch\n- Receivables aging started creeping — worth a closer look this week.',
    '[{"key":"active_jobs","label":"Active jobs","value":"21","status":"on_track"}]'::jsonb,
    'weekly-brief-agent',
    null
  )
on conflict (week_start) do nothing;

insert into public.findings (severity, title, summary_md, evidence, source, status, fingerprint, occurrences) values
  ('high', 'Receivables aging past 40 days', E'Avg days-to-pay reached **41** (target < 35). **$20,950** is overdue across two commercial accounts (Lakeside Property Mgmt, Gateway Retail Group). Follow-up is manual and easy to drop — a clear candidate for automated AR reminders.', '{"overdue_cents": 2095000, "accounts": 2, "ar_days": 41}'::jsonb, 'sweep-agent', 'open', 'ar:aging:over-40', 2),
  ('medium', 'Repeat callback on Gateway Retail rooftop unit', E'The same rooftop HVAC unit at Gateway Retail has been flagged **twice this month**. Recommend a replacement quote bundled into a preventive-maintenance contract rather than another patch.', '{"site": "Gateway Retail", "asset": "RTU-3"}'::jsonb, 'sweep-agent', 'open', 'callback:gateway:rtu-3', 2),
  ('low', 'Install-crew overtime trending up', E'Overtime on the install crew is up week-over-week. Schedule looks rebalanceable — shift two jobs next week to even the load.', '{}'::jsonb, 'sweep-agent', 'acknowledged', 'ops:overtime:install', 1)
on conflict (fingerprint) do nothing;

-- Value delivered this month (~$23k → ~4.6x the $5,000 retainer) so the ROI hero
-- renders a compelling, on-pitch number on a fresh demo. Basis is in metadata.
-- 4.6x clears the >=3x health target in `docs/gtm/retainer-tiers.md` — a real
-- number we can defend, not a flattering one.
-- Dates clamped to the current month so the this-month total renders in full
-- regardless of which day the demo is reset.
insert into public.value_events (occurred_at, category, label, amount_cents, source, metadata) values
  (greatest(now() - interval '1 day',  date_trunc('month', now())), 'revenue_captured', 'Automated AR follow-up recovered 3 overdue invoices', 1100000, 'agent',  '{}'::jsonb),
  (greatest(now() - interval '4 days',  date_trunc('month', now())), 'revenue_captured', 'Faster quoting won a maintenance contract',           550000,  'agent',  '{}'::jsonb),
  (greatest(now() - interval '6 days',  date_trunc('month', now())), 'hours_saved',      'Dispatch + reporting automation (32 hrs)',            320000,  'manual', '{"hours":32,"rate":100}'::jsonb),
  (greatest(now() - interval '9 days',  date_trunc('month', now())), 'cost_avoided',     'Deferred a part-time office hire',                    200000,  'manual', '{}'::jsonb),
  (greatest(now() - interval '12 days', date_trunc('month', now())), 'other',            'Misc workflow automations',                           130000,  'agent',  '{}'::jsonb);

insert into public.documents (path, title, content_md, tags) values
  ('strategy/positioning', 'Positioning', E'# Positioning\n\nWe keep commercial properties running and we get paid on time. Meridian sells **reliable facilities maintenance with no surprises** to property managers who can''t afford downtime.\n\n- **Who:** commercial property managers and facility owners.\n- **Wedge:** preventive-maintenance contracts that prevent the 2am emergency.\n- **Edge:** fast quoting, dependable crews, and tight receivables so the business stays healthy.', '{"strategy","gtm"}'),
  ('playbooks/onboarding', 'Client onboarding', E'# Client onboarding\n\n1. Provision the deck (clone, env, migrations, functions).\n2. Seed the first admin and invite stakeholders.\n3. Wire their metric/brief/finding agents to `report-ingest`.\n4. Connect Google Workspace for exports.\n5. Load their strategy docs so the assistant has context.', '{"playbook","ops"}')
on conflict (path) do nothing;

-- A disabled sample connector so the admin Connectors page renders on a fresh
-- clone. Set the CONNECTOR_STRIPE_SECRET_KEY secret and enable it to go live.
insert into public.connectors (type, name, enabled, config) values
  ('stripe', 'Stripe', false, '{}'::jsonb);

-- Loop Engine demo: an enabled ar_followup loop so the Loops page renders a
-- live-looking approve queue on a fresh clone. cadence_days drives the reminder
-- schedule (day-7, day-14, day-30 past due); sender_name is merged into the draft.
insert into public.loops (type, enabled, config) values
  ('ar_followup', true, '{"cadence_days":[7,14,30],"sender_name":"Meridian Accounts Receivable"}'::jsonb);

-- Sample AR invoices: two overdue commercial accounts (trigger reminder proposals
-- on the first loop run), one current (suppressed). Keyed on external_id so
-- re-seeding is idempotent.
insert into public.ar_invoices (external_id, customer_name, customer_email, amount_cents, due_date, status) values
  ('INV-2041', 'Lakeside Property Mgmt', 'billing@lakesidepm.example',   1420000, (now() - interval '18 days')::date, 'open'),
  ('INV-2042', 'Gateway Retail Group',   'ap@gatewayretail.example',      675000, (now() - interval '11 days')::date, 'open'),
  ('INV-2043', 'Hartwell Medical Plaza', 'finance@hartwellplaza.example',  940000, (now() + interval '10 days')::date, 'open')
on conflict (external_id) do nothing;

-- Meeting Transcript Reports demo: one realistic weekly ops meeting whose action
-- items are filed as findings (source 'transcript-agent', linked via evidence ->>
-- meeting_report_id), so the Meetings page renders a believable report on a fresh
-- clone. Wrapped in a CTE so the findings reference the generated report id.
with mr as (
  insert into public.meeting_reports (title, meeting_date, summary_md, transcript_chars, action_item_count, source)
  values (
    'Weekly Ops & Dispatch',
    now()::date,
    E'## Summary\n\nThe team walked the week''s board: 24 active jobs, pipeline healthy. Revenue is tracking under target — the issue is cash timing, not demand. Two large commercial invoices (Lakeside Property Mgmt and Gateway Retail Group) are now well past due and were flagged for follow-up. Gateway''s rooftop unit had a second callback this month; the crew recommends quoting a replacement bundled into a PM contract. Install-crew overtime is creeping up — schedule to be rebalanced next week.',
    5210, 3, 'manual')
  returning id
)
insert into public.findings (severity, title, summary_md, source, fingerprint, evidence)
select s.severity, s.title, s.summary_md, 'transcript-agent',
       'meeting:' || mr.id || ':' || s.idx,
       jsonb_build_object('meeting_report_id', mr.id)
from mr, (values
  (0, 'high',   'Chase overdue invoices — Lakeside & Gateway', E'Combined **$20,950** past due. Route both into the automated AR follow-up loop.'),
  (1, 'medium', 'Quote rooftop-unit replacement for Gateway Retail', E'Second callback on the same unit this month. Bundle into a preventive-maintenance contract.'),
  (2, 'low',    'Rebalance install-crew schedule next week', E'Overtime trending up; shift two jobs to even the load.')
) as s(idx, severity, title, summary_md);
