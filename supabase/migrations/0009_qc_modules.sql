-- Phase 4 — Modules conformité Québec (CCQ, retenue 10 %, SEAO)

-- Feuilles de temps CCQ par métier / chantier
create table if not exists public.qc_ccq_entries (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  job_id      uuid not null references public.jobs(id) on delete cascade,
  profile_id  uuid references public.profiles(id) on delete set null,
  metier      text not null,
  date        date not null default current_date,
  heures      numeric(6,2) not null default 0,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_qc_ccq_job on public.qc_ccq_entries(job_id, date desc);

-- Retenues de garantie 10 % (sous-traitants)
create table if not exists public.qc_retenues (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  job_id           uuid not null references public.jobs(id) on delete cascade,
  sous_traitant_id uuid references public.sous_traitants(id) on delete set null,
  description      text not null,
  facture_montant  numeric(12,2) not null,
  taux_retenue     numeric(5,4) not null default 0.10,
  montant_retenu   numeric(12,2) not null,
  montant_paye     numeric(12,2) not null default 0,
  statut           text not null default 'active',
  date_echeance    date,
  date_liberation  date,
  notes            text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_qc_retenues_job on public.qc_retenues(job_id);

-- Appels d'offres publics SEAO
create table if not exists public.qc_seao_avis (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  job_id            uuid references public.jobs(id) on delete set null,
  numero_avis       text not null,
  titre             text not null,
  organisme         text,
  date_publication  date,
  date_cloture      date,
  montant_estime    numeric(14,2),
  statut            text not null default 'a_soumettre',
  url               text,
  notes             text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_qc_seao_company on public.qc_seao_avis(company_id, date_cloture);

-- RLS
alter table public.qc_ccq_entries enable row level security;
alter table public.qc_retenues enable row level security;
alter table public.qc_seao_avis enable row level security;

create policy "CRUD qc_ccq_entries" on public.qc_ccq_entries
  for all using (company_id = get_my_company_id());

create policy "CRUD qc_retenues" on public.qc_retenues
  for all using (company_id = get_my_company_id());

create policy "CRUD qc_seao_avis" on public.qc_seao_avis
  for all using (company_id = get_my_company_id());
