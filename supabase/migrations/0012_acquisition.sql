-- Budgets pub par canal + score réel sur les prospects
alter table public.companies
  add column if not exists marketing_budgets jsonb default '{}'::jsonb;

alter table public.leads
  add column if not exists score integer;
