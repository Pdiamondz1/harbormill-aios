-- Demo seed for the "Mise" restaurant-group skin. A fictional 4-location group.
-- Safe to delete. Runs as the service role on `supabase db reset`.

insert into public.metric_snapshots (key, label, value, unit, target, status) values
  ('covers_week',  'Covers (wk)',      '3,180',  null, '3,400',   'at_risk'),
  ('avg_check',    'Avg check',        '$41.20', null, '$40.00',  'on_track'),
  ('food_cost',    'Food cost',        '31.4',   '%',  '< 30%',   'off_track'),
  ('labor_cost',   'Labor',            '28.1',   '%',  '< 29%',   'on_track'),
  ('table_turns',  'Table turns',      '2.7',    null, '3.0',     'at_risk'),
  ('google_rating','Google rating',    '4.6',    '★',  '4.5',     'on_track'),
  ('no_show',      'No-show rate',     '4.2',    '%',  '< 5%',    'on_track'),
  ('comps',        'Comps / voids',    '2.9',    '%',  '< 2%',    'off_track');

insert into public.briefings (week_start, title, body_md, kpis, generated_by, published_at) values
  (
    date_trunc('week', now())::date,
    'Weekly service brief',
    E'## Where the group stands\n\nSolid weekend, but two cost lines need a GM''s attention before they bite the P&L.\n\n### Highlights\n- **Avg check** up to $41.20 — the new shareable apps are landing.\n- **Reviews** holding at 4.6★ across all four rooms.\n\n### Watch\n- **Food cost** at 31.4% (target <30%). Protein waste at the Harbor St. location is the outlier — check the line on prep par levels.\n- **Comps** at 2.9% — mostly comped entrées on Friday dinner. Worth a look at ticket times that night.\n\n### Recommended focus\n1. Harbor St. line check on protein par + waste log, this week.\n2. Pull Friday dinner ticket times — comps track with the 7–9pm slam.',
    '[{"key":"food_cost","label":"Food cost","value":"31.4%","target":"<30%","status":"off_track"},{"key":"covers_week","label":"Covers","value":"3,180","target":"3,400","status":"at_risk"},{"key":"google_rating","label":"Rating","value":"4.6","target":"4.5","status":"on_track"}]'::jsonb,
    'weekly-brief-agent',
    now()
  ),
  (
    (date_trunc('week', now()) - interval '7 days')::date,
    'Weekly service brief',
    E'## Last week\n\nStrong covers, clean kitchen. Onboarded the new brunch menu at two locations.\n\n### Highlights\n- Brunch attach rate beat plan at Pier 9.\n- Labor held at 27.6% despite the holiday weekend.',
    '[{"key":"labor_cost","label":"Labor","value":"27.6%","target":"<29%","status":"on_track"}]'::jsonb,
    'weekly-brief-agent',
    null
  )
on conflict (week_start) do nothing;

insert into public.findings (severity, title, summary_md, evidence, source, status, fingerprint, occurrences) values
  ('high', 'POS sync gap during Friday dinner', E'Toast → deck sync dropped **47 tickets** between 7:10–8:05pm Friday at Harbor St. Covers and comps under-reported for that window.', '{"location": "Harbor St", "window": "Fri 19:10-20:05", "missing_tickets": 47}'::jsonb, 'sweep-agent', 'open', 'pos:sync:harbor-fri-dinner', 2),
  ('medium', '86''d item still bookable online', E'"Branzino" was 86''d on the line but stayed orderable on the online menu for ~2 hours, generating 6 refunded orders.', '{}'::jsonb, 'sweep-agent', 'acknowledged', 'menu:86:online-sync', 1)
on conflict (fingerprint) do nothing;

insert into public.documents (path, title, content_md, tags) values
  ('strategy/positioning', 'Group positioning', E'# Positioning\n\nApproachable neighborhood dining at a notch above casual — **the reliable special-occasion-and-also-Tuesday** spot.\n\n- **Who:** repeat locals, 30–55, who value consistency over novelty.\n- **Edge:** the same warm room and menu execution across every location.\n- **Cost discipline:** food cost is the daily battle — par levels + waste logs win it.', '{"strategy","ops"}'),
  ('playbooks/line-check', 'Opening line check', E'# Opening line check\n\n1. Walk-in temps logged, FIFO rotation verified.\n2. Prep pars hit for the day''s covers forecast (pull from the deck).\n3. 86 board cleared and synced to the online menu.\n4. Station mise complete, ticket printer tested.\n5. Comp/void log from last night reviewed with the closing manager.', '{"playbook","kitchen"}')
on conflict (path) do nothing;
