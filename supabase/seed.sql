-- Demo seed so a fresh clone renders a live-looking deck before a client wires
-- their own agents. Safe to delete. Runs as the service role on `supabase db reset`.

insert into public.metric_snapshots (key, label, value, unit, target, status) values
  ('mrr',            'MRR',              '$48,200', null, '$60,000', 'at_risk'),
  ('active_clients', 'Active clients',   '37',      null, '40',      'on_track'),
  ('nps',            'NPS',              '62',      null, '60',      'on_track'),
  ('churn',          'Churn (30d)',      '3.1',     '%',  '< 2.5%',  'off_track'),
  ('pipeline',       'Pipeline',         '$112k',   null, null,      'on_track'),
  ('tickets_open',   'Open tickets',     '8',       null, '< 10',    'on_track'),
  ('uptime',         'Uptime (30d)',     '99.96',   '%',  '99.9%',   'on_track'),
  ('csat',           'CSAT',             '4.7',     '★',  '4.5',     'on_track');

insert into public.briefings (week_start, title, body_md, kpis, generated_by, published_at) values
  (
    date_trunc('week', now())::date,
    'Weekly operating brief',
    E'## Where we stand\n\nRevenue is tracking just under target while retention holds. Two items need attention this week.\n\n### Highlights\n- **Active clients** crossed 37, on pace for the Q-target.\n- **Uptime** held at 99.96% through the deploy window.\n\n### Watch\n- **Churn** ticked to 3.1% — two enterprise accounts flagged at-risk. Owner: success team.\n- **MRR** is $11.8k under target; pipeline coverage is healthy, so this is a close-rate problem, not a top-of-funnel one.\n\n### Recommended focus\n1. Save play on the two at-risk accounts before Thursday.\n2. Tighten the proposal-to-close step — that''s where the gap is.',
    '[{"key":"mrr","label":"MRR","value":"$48,200","target":"$60,000","status":"at_risk"},{"key":"churn","label":"Churn","value":"3.1%","target":"<2.5%","status":"off_track"},{"key":"nps","label":"NPS","value":"62","target":"60","status":"on_track"}]'::jsonb,
    'weekly-brief-agent',
    now()
  ),
  (
    (date_trunc('week', now()) - interval '7 days')::date,
    'Weekly operating brief',
    E'## Last week\n\nA quieter week. Onboarded three new clients and shipped the reporting export.\n\n### Highlights\n- Three new logos signed.\n- Reporting export shipped on schedule.\n\n### Watch\n- Support volume rose with the new cohort — staffing looks adequate for now.',
    '[{"key":"active_clients","label":"Active clients","value":"34","target":"40","status":"on_track"}]'::jsonb,
    'weekly-brief-agent',
    null
  )
on conflict (week_start) do nothing;

insert into public.findings (severity, title, summary_md, evidence, source, status, fingerprint, occurrences) values
  ('high', 'Checkout latency spike on mobile', E'p95 checkout latency rose to **2.4s** on mobile after the Tuesday deploy. Desktop unaffected.\n\nLikely the new analytics call on the payment step blocking render.', '{"p95_ms": 2400, "platform": "mobile", "since": "deploy-tue"}'::jsonb, 'sweep-agent', 'open', 'perf:checkout:mobile-p95', 3),
  ('low', 'Stale cache header on /pricing', E'The `/pricing` page ships a 1-year `max-age` but changes weekly, so edits lag for returning visitors.', '{}'::jsonb, 'sweep-agent', 'acknowledged', 'cache:pricing:max-age', 1)
on conflict (fingerprint) do nothing;

insert into public.documents (path, title, content_md, tags) values
  ('strategy/positioning', 'Positioning', E'# Positioning\n\nWe sell **operational clarity** to mid-market operators who are flying blind between their tools.\n\n- **Who:** 20–200 person services & SaaS businesses.\n- **Wedge:** the weekly brief — the one artifact a busy operator actually reads.\n- **Moat:** the assistant gets smarter on their data over time.', '{"strategy","gtm"}'),
  ('playbooks/onboarding', 'Client onboarding', E'# Client onboarding\n\n1. Provision the deck (clone, env, migrations, functions).\n2. Seed the first admin and invite stakeholders.\n3. Wire their metric/brief/finding agents to `report-ingest`.\n4. Connect Google Workspace for exports.\n5. Load their strategy docs so the assistant has context.', '{"playbook","ops"}')
on conflict (path) do nothing;
