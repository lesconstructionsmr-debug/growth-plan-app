-- Phase 3 — Dossier chantier unifié (documents, pointages, lien factures)

-- Documents du chantier (plans, photos, mesures, extras)
create table if not exists public.job_documents (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  job_id       uuid not null references public.jobs(id) on delete cascade,
  type         text not null default 'document',
  titre        text not null,
  file_url     text,
  mime_type    text,
  file_size    integer,
  uploaded_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_job_documents_job on public.job_documents(job_id, created_at desc);

-- Pointages employés sur chantier
create table if not exists public.pointages (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  job_id            uuid not null references public.jobs(id) on delete cascade,
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  date              date not null default current_date,
  heure_debut       time not null,
  heure_fin         time,
  duree_minutes     integer,
  dans_rayon_debut  boolean default true,
  dans_rayon_fin    boolean default true,
  notes             text,
  approuve          boolean default false,
  created_at        timestamptz not null default now()
);

create index if not exists idx_pointages_job on public.pointages(job_id, date desc);
create index if not exists idx_pointages_profile on public.pointages(profile_id, date desc);

-- Lien direct facture → chantier (en plus de devis_id)
alter table public.factures add column if not exists job_id uuid references public.jobs(id) on delete set null;
create index if not exists idx_factures_job_id on public.factures(job_id);

-- RLS
alter table public.job_documents enable row level security;
alter table public.pointages enable row level security;

create policy "CRUD job_documents" on public.job_documents
  for all using (company_id = get_my_company_id());

create policy "CRUD pointages" on public.pointages
  for all using (company_id = get_my_company_id());
