-- ══════════════════════════════════════════════════════════════════════
-- MIGRATION 0003 — Signatures Électroniques, Sous-Traitants & Relances
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. SIGNATURES ÉLECTRONIQUES SUR DEVIS ────────────────────────────
alter table public.devis add column if not exists signature_data text;
alter table public.devis add column if not exists signe_le timestamptz;
alter table public.devis add column if not exists signataire_nom text;

-- ── 2. TABLE SOUS-TRAITANTS ──────────────────────────────────────────
create table if not exists public.sous_traitants (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  nom          text not null,
  entreprise   text,
  telephone    text,
  email        text,
  rbq_no       text,
  tps_no       text,
  tvq_no       text,
  specialite   text, -- électricité | plomberie | peinture | menuiserie | maçonnerie | ventilation | général
  statut       text default 'actif', -- actif | inactif
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- RLS sous-traitants
alter table public.sous_traitants enable row level security;
create policy "CRUD sous_traitants" on public.sous_traitants
  for all using (company_id = get_my_company_id());

-- Index de performance sous-traitants
create index if not exists idx_sous_traitants_company_id on public.sous_traitants (company_id);

-- Lien sous-traitant dans les dépenses
alter table public.depenses add column if not exists sous_traitant_id uuid references public.sous_traitants(id) on delete set null;

-- ── 3. TABLE HISTORIQUE DES RELANCES ─────────────────────────────────
create table if not exists public.relances (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  devis_id     uuid references public.devis(id) on delete cascade,
  facture_id   uuid references public.factures(id) on delete cascade,
  canal        text not null default 'email', -- email | sms
  destinataire text not null,
  message      text,
  envoye_le    timestamptz default now()
);

-- RLS relances
alter table public.relances enable row level security;
create policy "CRUD relances" on public.relances
  for all using (company_id = get_my_company_id());

create index if not exists idx_relances_company_id on public.relances (company_id);
create index if not exists idx_relances_devis_id on public.relances (devis_id);
create index if not exists idx_relances_facture_id on public.relances (facture_id);
