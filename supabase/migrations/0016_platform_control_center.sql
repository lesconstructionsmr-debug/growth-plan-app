-- ══════════════════════════════════════════════════════════════════
-- 0016 — Centre de contrôle Plan Growth (Max)
--
-- Exécution : Supabase → SQL Editor → New query → coller → Run.
-- Tables plateforme (pas multi-tenant compagnies). Accès via API
-- admin (service role) après vérif email fondateur.
-- ══════════════════════════════════════════════════════════════════

-- Tâches personnelles du fondateur
create table if not exists public.platform_tasks (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  notes       text,
  statut      text not null default 'a_faire'
                check (statut in ('a_faire', 'en_cours', 'fait', 'annule')),
  priorite    text not null default 'normale'
                check (priorite in ('basse', 'normale', 'haute', 'urgente')),
  due_date    date,
  lead_id     uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_platform_tasks_statut on public.platform_tasks(statut);
create index if not exists idx_platform_tasks_due on public.platform_tasks(due_date);

-- Leads d'adhésion à Plan Growth (pas leads chantier client)
create table if not exists public.platform_leads (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null,
  email         text,
  telephone     text,
  entreprise    text,
  source        text default 'manuel',
  -- nouveau → contacte → qualifie → essai → client → perdu
  statut        text not null default 'nouveau'
                  check (statut in ('nouveau', 'contacte', 'qualifie', 'essai', 'client', 'perdu')),
  besoin        text, -- structure_numerique | optimisation | les_deux | autre
  taille_equipe text, -- solo | 2-5 | 6-15 | 16+
  score         int,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_platform_leads_statut on public.platform_leads(statut);
create index if not exists idx_platform_leads_email on public.platform_leads(email);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'platform_tasks_lead_id_fkey'
  ) then
    alter table public.platform_tasks
      add constraint platform_tasks_lead_id_fkey
      foreign key (lead_id) references public.platform_leads(id) on delete set null;
  end if;
end $$;

create or replace function public.set_platform_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists platform_tasks_updated_at on public.platform_tasks;
create trigger platform_tasks_updated_at
  before update on public.platform_tasks
  for each row execute function public.set_platform_updated_at();

drop trigger if exists platform_leads_updated_at on public.platform_leads;
create trigger platform_leads_updated_at
  before update on public.platform_leads
  for each row execute function public.set_platform_updated_at();

alter table public.platform_tasks enable row level security;
alter table public.platform_leads enable row level security;

-- Pas de policy user : accès uniquement via service_role (API admin)
