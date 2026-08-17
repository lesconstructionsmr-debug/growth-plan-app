-- Courriel unique par compagnie + provenance des dépenses (scan / courriel)
alter table public.companies
  add column if not exists expenses_inbox_key text unique;

alter table public.depenses
  add column if not exists source text,
  add column if not exists inbound_ref text;

create unique index if not exists idx_depenses_inbound_ref
  on public.depenses (company_id, inbound_ref)
  where inbound_ref is not null;
