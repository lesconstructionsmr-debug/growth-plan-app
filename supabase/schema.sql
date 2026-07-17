-- ══════════════════════════════════════════════════════════════════
-- Plan Growth ERP — Schéma Supabase Multi-Tenant
-- Colle ce SQL dans Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════

-- ── 1. TABLES ─────────────────────────────────────────────────────

-- Compagnies (un abonné SaaS = une compagnie)
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
  vertical    text default 'construction',  -- construction | marketing | courtier
  team_size   text,                         -- solo | small | medium | large
  created_at  timestamptz default now()
);

-- Migration: ajouter vertical/team_size si la table existe déjà
alter table public.companies add column if not exists vertical text default 'construction';
alter table public.companies add column if not exists team_size text;

-- Profils utilisateurs (étend auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete cascade,
  full_name   text,
  role        text default 'owner',  -- owner | admin | employee
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Clients
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

-- Projets / Chantiers
create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete set null,
  titre       text not null,
  description text,
  statut      text default 'planifié',  -- planifié | en_cours | terminé | annulé
  date_debut  date,
  date_fin    date,
  budget      numeric(12,2),
  adresse     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Devis
create table if not exists public.devis (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  client_id        uuid references public.clients(id) on delete set null,
  job_id           uuid references public.jobs(id) on delete set null,
  numero           text not null,
  titre            text,
  statut           text default 'brouillon',  -- brouillon | envoyé | approuvé | refusé | converti
  lignes           jsonb default '[]',         -- [{ description, quantite, unite, prix_unitaire }]
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

-- Factures
create table if not exists public.factures (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  client_id       uuid references public.clients(id) on delete set null,
  devis_id        uuid references public.devis(id) on delete set null,
  numero          text not null,
  titre           text,
  statut          text default 'brouillon',  -- brouillon | envoyée | payée | en_retard | annulée
  lignes          jsonb default '[]',         -- [{ description, quantite, unite, prix_unitaire }]
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

-- Leads / CRM
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  nom              text not null,
  email            text,
  telephone        text,
  source           text,  -- google | facebook | référence | site_web | autre
  statut           text default 'nouveau',  -- nouveau | contacté | qualifié | proposition | gagné | perdu
  valeur_estimee   numeric(12,2),
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Employés
create table if not exists public.employes (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  nom          text not null,
  email        text,
  telephone    text,
  poste        text,
  taux_horaire numeric(8,2),
  statut       text default 'actif',  -- actif | inactif
  created_at   timestamptz default now()
);

-- Dépenses
create table if not exists public.depenses (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  job_id       uuid references public.jobs(id) on delete set null,
  description  text not null,
  montant      numeric(12,2) not null,
  categorie    text,  -- matériaux | équipement | sous-traitant | transport | autre
  date_depense date default current_date,
  created_at   timestamptz default now()
);

-- Notes internes (journal de suivi par client)
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete cascade,
  job_id      uuid references public.jobs(id) on delete set null,
  auteur_id   uuid references auth.users(id) on delete set null,
  type        text default 'note',  -- note | appel | specification | document | rappel
  contenu     text not null,
  created_at  timestamptz default now()
);

-- Invitations équipe
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  email       text not null,
  role        text default 'collaborateur',  -- owner | admin | collaborateur
  token       text unique default encode(gen_random_bytes(24), 'hex'),
  accepted    boolean default false,
  invited_by  uuid references auth.users(id),
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '7 days')
);

-- Abonnements Stripe (sync webhook)
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  company_id             uuid references public.companies(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text,  -- trialing | active | past_due | canceled
  plan                   text,  -- mensuel | annuel
  trial_end              timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- ── 2. ROW LEVEL SECURITY ─────────────────────────────────────────

alter table public.companies     enable row level security;
alter table public.profiles      enable row level security;
alter table public.clients       enable row level security;
alter table public.jobs          enable row level security;
alter table public.devis         enable row level security;
alter table public.factures      enable row level security;
alter table public.leads         enable row level security;
alter table public.employes      enable row level security;
alter table public.depenses      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notes       enable row level security;
alter table public.invitations enable row level security;

-- Fonction helper : retourne le company_id de l'utilisateur connecté
create or replace function public.get_my_company_id()
returns uuid
language sql
security definer
stable
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- Policies companies
create policy "Voir sa compagnie" on public.companies
  for select using (id = get_my_company_id());
create policy "Modifier sa compagnie" on public.companies
  for update using (id = get_my_company_id());

-- Policies profiles
-- SELECT : voir son propre profil ET les profils des collègues de la même compagnie
create policy "Voir les profils de son entreprise" on public.profiles
  for select using (
    id = auth.uid()
    OR company_id = get_my_company_id()
  );
-- UPDATE : modifier uniquement son propre profil
create policy "Modifier son profil" on public.profiles
  for update using (id = auth.uid());

-- Policies tables métier (CRUD complet, isolé par company_id)
create policy "clients_isolation" on public.clients
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "jobs_isolation" on public.jobs
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "devis_isolation" on public.devis
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "factures_isolation" on public.factures
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "leads_isolation" on public.leads
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "employes_isolation" on public.employes
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "depenses_isolation" on public.depenses
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "subscriptions_isolation" on public.subscriptions
  for all using (company_id = get_my_company_id());

create policy "notes_isolation" on public.notes
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "invitations_isolation" on public.invitations
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

-- ── 3. TRIGGER — Création automatique compagnie + profil à l'inscription ──

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  new_company_id uuid;
begin
  insert into public.companies (name, telephone, ville, vertical, team_size)
  values (
    coalesce(new.raw_user_meta_data->>'company_name', 'Mon Entreprise'),
    new.raw_user_meta_data->>'telephone',
    new.raw_user_meta_data->>'ville',
    coalesce(new.raw_user_meta_data->>'vertical', 'construction'),
    new.raw_user_meta_data->>'team_size'
  )
  returning id into new_company_id;

  insert into public.profiles (id, company_id, full_name, role)
  values (
    new.id,
    new_company_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  insert into public.subscriptions (company_id, status, trial_end)
  values (new_company_id, 'trialing', now() + interval '14 days');

  return new;
end;
$$;

-- Attacher le trigger sur auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 4. INDEX pour performances ─────────────────────────────────────

create index if not exists idx_clients_company   on public.clients(company_id);
create index if not exists idx_jobs_company      on public.jobs(company_id);
create index if not exists idx_devis_company     on public.devis(company_id);
create index if not exists idx_factures_company  on public.factures(company_id);
create index if not exists idx_leads_company     on public.leads(company_id);
create index if not exists idx_employes_company  on public.employes(company_id);
create index if not exists idx_depenses_company  on public.depenses(company_id);
create index if not exists idx_profiles_company    on public.profiles(company_id);
create index if not exists idx_notes_company      on public.notes(company_id);
create index if not exists idx_notes_client       on public.notes(client_id);
create index if not exists idx_invitations_token  on public.invitations(token);
create index if not exists idx_invitations_email  on public.invitations(email);
