-- ══════════════════════════════════════════════════════════════════
-- Plan Growth — Addendum Vertical Agence (Courtier Hypothécaire)
-- Colle ce SQL dans Supabase → SQL Editor → New Query → Run
-- Ce script ne touche PAS aux tables existantes — seulement ADD.
-- ══════════════════════════════════════════════════════════════════

-- 1. Ajouter le champ vertical à companies
alter table public.companies
  add column if not exists vertical text default 'construction';
-- Valeurs possibles: 'construction' | 'agence'

-- ── 2. PRÊTEURS ────────────────────────────────────────────────────
create table if not exists public.preteurs (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  nom           text not null,
  type          text default 'banque',  -- banque | caisse | prive | assureur | autre
  contact_nom   text,
  contact_email text,
  contact_tel   text,
  notes         text,
  actif         boolean default true,
  created_at    timestamptz default now()
);

-- ── 3. DOSSIERS HYPOTHÉCAIRES ──────────────────────────────────────
create table if not exists public.dossiers (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  client_id        uuid references public.clients(id) on delete set null,
  preteur_id       uuid references public.preteurs(id) on delete set null,
  numero           text not null default ('DOS-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random()*9000+1000)::text, 4, '0')),
  phase            text default 'prise_en_charge',
  -- prise_en_charge | montage | soumission | approbation | finalisation | clos | annule
  etiquette        text default 'nouveau_lead',
  type_transaction text default 'achat',  -- achat | renouvellement | refinancement | transfert
  montant_pret     numeric(14,2),
  taux_commission  numeric(6,4),   -- ex: 0.0080 = 0.80%
  commission_brute numeric(12,2),
  date_soumission  date,
  date_approbation date,
  date_notariat    date,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── 4. COMMISSIONS ─────────────────────────────────────────────────
create table if not exists public.commissions (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  dossier_id   uuid references public.dossiers(id) on delete set null,
  preteur_id   uuid references public.preteurs(id) on delete set null,
  montant      numeric(12,2) not null,
  statut       text default 'a_recevoir',  -- a_recevoir | recu | annule
  date_prevue  date,
  date_recue   date,
  notes        text,
  created_at   timestamptz default now()
);

-- ── 5. ROW LEVEL SECURITY ──────────────────────────────────────────
alter table public.preteurs    enable row level security;
alter table public.dossiers    enable row level security;
alter table public.commissions enable row level security;

create policy "preteurs_isolation" on public.preteurs
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "dossiers_isolation" on public.dossiers
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

create policy "commissions_isolation" on public.commissions
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

-- ── 6. INDEX ───────────────────────────────────────────────────────
create index if not exists idx_preteurs_company    on public.preteurs(company_id);
create index if not exists idx_dossiers_company    on public.dossiers(company_id);
create index if not exists idx_dossiers_client     on public.dossiers(client_id);
create index if not exists idx_dossiers_phase      on public.dossiers(phase);
create index if not exists idx_commissions_company on public.commissions(company_id);
create index if not exists idx_commissions_dossier on public.commissions(dossier_id);
