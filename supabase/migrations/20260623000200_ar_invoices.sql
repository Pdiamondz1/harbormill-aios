-- ar_invoices: vendor-neutral overdue-invoice store, fed via report-ingest
create table public.ar_invoices (
  id               uuid primary key default gen_random_uuid(),
  external_id      text not null,
  customer_name    text not null,
  customer_email   text,
  amount_cents     integer not null check (amount_cents >= 0),
  due_date         date not null,
  status           text not null default 'open' check (status in ('open','paid','written_off')),
  last_reminded_at timestamptz,
  captured_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  unique (external_id)
);
create index idx_ar_invoices_status_due on public.ar_invoices (status, due_date);

alter table public.ar_invoices enable row level security;
create policy "ar_invoices admin all" on public.ar_invoices
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
