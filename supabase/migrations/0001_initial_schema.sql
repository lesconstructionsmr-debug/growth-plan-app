-- ══════════════════════════════════════════════════════════════════════
-- MIGRATION 0001 — Schéma initial Growth Plan ERP
-- Généré le 2026-07-17 à partir du schema.sql de référence
-- Idempotent : toutes les instructions utilisent IF NOT EXISTS
-- ══════════════════════════════════════════════════════════════════════

-- ── EXTENSIONS ────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── HELPER MULTI-TENANT ───────────────────────────────────────────────
create or replace function get_my_company_id()
returns uuid language sql stable security definer as $$
  select company_id from public.profiles where id = auth.uid() limit 1;
$$;

-- ── TABLES ────────────────────────────────────────────────────────────

create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Mon Entreprise',
  telephone   text,
  adresse     text,
  ville       text,
  province    text default 'QC',
  code_postal text,
  tps_no      text,
  tvq_no      text,
  logo_url    text,
  vertical    text default 'construction',
  team_size   text,
  created_at  timestamptz default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete cascade,
  full_name   text,
  role        text default 'owner',
  avatar_url  text,
  created_at  timestamptz default now()
);

create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  nom         text not null,
  email       text,
  telephone   text,
  adresse     text,
  ville       text,
  province    text default 'QC',
  code_postal text,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete set null,
  titre       text not null,
  description text,
  statut      text default 'planifié',
  date_debut  date,
  date_fin    date,
  budget      numeric(12,2),
  adresse     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.devis (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  client_id        uuid references public.clients(id) on delete set null,
  job_id           uuid references public.jobs(id) on delete set null,
  numero           text not null,
  titre            text,
  statut           text default 'brouillon',
  lignes           jsonb default '[]',
  montant_ht       numeric(12,2) default 0,
  tps              numeric(12,2) default 0,
  tvq              numeric(12,2) default 0,
  montant_ttc      numeric(12,2) default 0,
  notes            text,
  notes_internes   text,
  reference_projet text,
  date_emission    date default current_date,
  valide_jusqu_au  date,
  envoye_le        timestamptz,
  approuve_le      timestamptz,
  portal_token     text unique default encode(gen_random_bytes(24), 'hex'),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table if not exists public.factures (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  client_id       uuid references public.clients(id) on delete set null,
  devis_id        uuid references public.devis(id) on delete set null,
  numero          text not null,
  titre           text,
  statut          text default 'brouillon',
  lignes          jsonb default '[]',
  montant_ht      numeric(12,2) default 0,
  tps             numeric(12,2) default 0,
  tvq             numeric(12,2) default 0,
  montant_ttc     numeric(12,2) default 0,
  date_emission   date default current_date,
  date_echeance   date,
  date_paiement   date,
  mode_reglement  text default 'virement',
  notes           text,
  notes_internes  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  nom              text not null,
  email            text,
  telephone        text,
  source           text,
  statut           text default 'nouveau',
  valeur_estimee   numeric(12,2),
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table if not exists public.employes (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  nom          text not null,
  email        text,
  telephone    text,
  poste        text,
  taux_horaire numeric(8,2),
  statut       text default 'actif',
  created_at   timestamptz default now()
);

create table if not exists public.depenses (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  job_id       uuid references public.jobs(id) on delete set null,
  description  text not null,
  montant      numeric(12,2) not null,
  categorie    text,
  date_depense date default current_date,
  created_at   timestamptz default now()
);

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete cascade,
  job_id      uuid references public.jobs(id) on delete set null,
  auteur_id   uuid references auth.users(id) on delete set null,
  type        text default 'note',
  contenu     text not null,
  created_at  timestamptz default now()
);

create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  email       text not null,
  role        text default 'collaborateur',
  token       text unique default encode(gen_random_bytes(24), 'hex'),
  accepted    boolean default false,
  invited_by  uuid references auth.users(id),
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '7 days')
);

create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  company_id             uuid unique references public.companies(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text,
  plan                   text,
  trial_end              timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────

alter table public.companies    enable row level security;
alter table public.profiles     enable row level security;
alter table public.clients      enable row level security;
alter table public.jobs         enable row level security;
alter table public.devis        enable row level security;
alter table public.factures     enable row level security;
alter table public.leads        enable row level security;
alter table public.employes     enable row level security;
alter table public.depenses     enable row level security;
alter table public.notes        enable row level security;
alter table public.invitations  enable row level security;
alter table public.subscriptions enable row level security;

-- Policies companies
create policy "Voir sa compagnie" on public.companies
  for select using (id = get_my_company_id());
create policy "Modifier sa compagnie" on public.companies
  for update using (id = get_my_company_id());

-- Policies profiles
create policy "Voir les profils de son entreprise" on public.profiles
  for select using (id = auth.uid() OR company_id = get_my_company_id());
create policy "Modifier son profil" on public.profiles
  for update using (id = auth.uid());

-- Policies métier (clients, jobs, devis, factures, leads, employes, depenses, notes, invitations)
do $$ declare t text; begin
  foreach t in array array['clients','jobs','devis','factures','leads','employes','depenses','notes','invitations']
  loop
    execute format('create policy "CRUD %s" on public.%I for all using (company_id = get_my_company_id())', t, t);
  end loop;
end $$;

-- Policies subscriptions
create policy "Voir son abonnement" on public.subscriptions
  for select using (company_id = get_my_company_id());
create policy "Modifier son abonnement" on public.subscriptions
  for update using (company_id = get_my_company_id());

-- ── CONTRAINTES D'UNICITÉ (anti-collision) ────────────────────────────

alter table public.devis
  add constraint if not exists devis_company_numero_unique unique (company_id, numero);
alter table public.factures
  add constraint if not exists factures_company_numero_unique unique (company_id, numero);

-- ── INDEX DE PERFORMANCE ──────────────────────────────────────────────

create index if not exists idx_devis_portal_token        on public.devis    (portal_token);
create index if not exists idx_devis_company_id_created  on public.devis    (company_id, created_at desc);
create index if not exists idx_devis_company_numero      on public.devis    (company_id, numero);
create index if not exists idx_devis_client_id           on public.devis    (client_id);
create index if not exists idx_factures_company_id_created on public.factures (company_id, created_at desc);
create index if not exists idx_factures_company_numero   on public.factures (company_id, numero);
create index if not exists idx_factures_client_id        on public.factures (client_id);
create index if not exists idx_factures_devis_id         on public.factures (devis_id);
create index if not exists idx_jobs_company_id           on public.jobs     (company_id);
create index if not exists idx_jobs_client_id            on public.jobs     (client_id);
create index if not exists idx_leads_company_id          on public.leads    (company_id);
create index if not exists idx_notes_company_id          on public.notes    (company_id);
create index if not exists idx_notes_client_id           on public.notes    (client_id);
create index if not exists idx_depenses_company_id       on public.depenses (company_id);
create index if not exists idx_employes_company_id       on public.employes (company_id);
