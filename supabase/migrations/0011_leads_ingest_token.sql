alter table public.companies
  add column if not exists leads_ingest_token uuid unique;

create unique index if not exists idx_companies_leads_ingest_token
  on public.companies (leads_ingest_token)
  where leads_ingest_token is not null;
