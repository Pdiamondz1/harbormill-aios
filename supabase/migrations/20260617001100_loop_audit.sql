-- Loop Audit (Phase 2): the Four-Condition Loop Test as a sibling mode of the
-- ROI-discovery audit. Additive + defaulted/nullable, so existing audits are
-- unaffected. New columns inherit the tables' admin-only RLS (no policy change).

alter table public.audits
  add column is_loop_audit boolean not null default false;

alter table public.audit_opportunities
  add column loop_repeats      text check (loop_repeats in ('strong','partial','weak')),
  add column loop_done_rule    boolean,
  add column loop_afford_waste text check (loop_afford_waste in ('strong','partial','weak')),
  add column loop_has_tools    boolean;
