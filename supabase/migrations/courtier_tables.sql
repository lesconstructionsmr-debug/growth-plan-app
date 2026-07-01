-- =============================================================
-- Migration: Tables courtier hypothécaire
-- À exécuter dans Supabase > SQL Editor
-- =============================================================

-- PRÊTEURS
create table if not exists preteurs (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  nom           text not null,
  type          text not null default 'banque' check (type in ('banque', 'caisse', 'privé', 'assureur')),
  contact_nom   text,
  contact_email text,
  contact_tel   text,
  notes         text,
  actif         boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table preteurs enable row level security;

create policy "preteurs_select" on preteurs for select
  using (company_id = get_my_company_id());

create policy "preteurs_insert" on preteurs for insert
  with check (company_id = get_my_company_id());

create policy "preteurs_update" on preteurs for update
  using (company_id = get_my_company_id());

create policy "preteurs_delete" on preteurs for delete
  using (company_id = get_my_company_id());

-- DOSSIERS
create table if not exists dossiers (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  numero          text not null,
  client_id       uuid references clients(id) on delete set null,
  preteur_id      uuid references preteurs(id) on delete set null,
  phase           text not null default 'prise_en_charge'
                    check (phase in ('prise_en_charge','montage','soumission','approbation','finalisation')),
  type_pret       text,
  montant         numeric(14,2),
  taux            numeric(5,3),
  date_soumission date,
  date_approbation date,
  date_financement date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table dossiers enable row level security;

create policy "dossiers_select" on dossiers for select
  using (company_id = get_my_company_id());

create policy "dossiers_insert" on dossiers for insert
  with check (company_id = get_my_company_id());

create policy "dossiers_update" on dossiers for update
  using (company_id = get_my_company_id());

create policy "dossiers_delete" on dossiers for delete
  using (company_id = get_my_company_id());

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger dossiers_updated_at before update on dossiers
  for each row execute function set_updated_at();

-- Numéro auto: DOS-2026-0001
create or replace function generate_dossier_numero()
returns trigger language plpgsql as $$
declare
  yr  text := to_char(now(), 'YYYY');
  seq int;
begin
  select count(*) + 1 into seq
    from dossiers
   where company_id = new.company_id
     and extract(year from created_at) = extract(year from now());
  new.numero := 'DOS-' || yr || '-' || lpad(seq::text, 4, '0');
  return new;
end;
$$;

create trigger dossiers_numero_trigger before insert on dossiers
  for each row when (new.numero is null or new.numero = '')
  execute function generate_dossier_numero();

-- COMMISSIONS
create table if not exists commissions (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  dossier_id   uuid references dossiers(id) on delete set null,
  preteur_id   uuid references preteurs(id) on delete set null,
  montant      numeric(14,2) not null,
  taux         numeric(5,3),
  type         text not null default 'initiale' check (type in ('initiale','renouvellement','référence')),
  statut       text not null default 'en_attente' check (statut in ('en_attente','reçue','annulée')),
  date_paiement date,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table commissions enable row level security;

create policy "commissions_select" on commissions for select
  using (company_id = get_my_company_id());

create policy "commissions_insert" on commissions for insert
  with check (company_id = get_my_company_id());

create policy "commissions_update" on commissions for update
  using (company_id = get_my_company_id());

create policy "commissions_delete" on commissions for delete
  using (company_id = get_my_company_id());
