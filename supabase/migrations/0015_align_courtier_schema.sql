-- ══════════════════════════════════════════════════════════════════
-- 0015 — Aligner le schéma courtier (Plan Growth, vertical agence)
--
-- Exécution : Dashboard Supabase → SQL Editor → New query → coller
-- ce fichier entier → Run. Idempotent : un 2e passage est sans danger.
-- Unifie schema-agence.sql et courtier_tables.sql vers les colonnes
-- déjà utilisées par l’UI (etiquette, type_transaction, montant_pret…).
--
-- Ne touche PAS aux tables Construction (jobs, job_assignments,
-- employés, sous-traitants, qc_*). Aucun INSERT de prêteurs (seed manuel).
-- ══════════════════════════════════════════════════════════════════

-- Helpers de session (disparaissent à la fin de la connexion)
create or replace function pg_temp.copy_col(p_table text, p_from text, p_to text)
returns void
language plpgsql as $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = p_table and column_name = p_from
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = p_table and column_name = p_to
  ) then
    execute format(
      'update public.%I set %I = %I where %I is null and %I is not null',
      p_table, p_to, p_from, p_to, p_from
    );
  end if;
end;
$$;

create or replace function pg_temp.drop_checks(p_table text, p_needle text)
returns void
language plpgsql as $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = p_table
      and c.contype = 'c'
      and (
        c.conname ilike '%' || p_needle || '%'
        or pg_get_constraintdef(c.oid) ilike '%' || p_needle || '%'
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', p_table, r.conname);
  end loop;
end;
$$;

-- ── 1. COMPANIES (AMF + type de pratique) ────────────────────────────
alter table public.companies
  add column if not exists numero_amf text,
  add column if not exists amf_expiration date,
  add column if not exists courtier_type text default 'solo';

alter table public.companies alter column courtier_type set default 'solo';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'companies_courtier_type_check'
  ) then
    if not exists (
      select 1 from public.companies
      where courtier_type is not null
        and courtier_type not in ('solo', 'agence')
    ) then
      alter table public.companies
        add constraint companies_courtier_type_check
        check (courtier_type is null or courtier_type in ('solo', 'agence'));
    end if;
  end if;
end $$;

-- ── 2. PRÊTEURS ──────────────────────────────────────────────────────
create table if not exists public.preteurs (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  nom           text not null,
  type          text default 'banque',
  contact_nom   text,
  contact_email text,
  contact_tel   text,
  notes         text,
  actif         boolean default true,
  created_at    timestamptz default now()
);

alter table public.preteurs add column if not exists company_id uuid;
alter table public.preteurs add column if not exists nom text;
alter table public.preteurs add column if not exists type text default 'banque';
alter table public.preteurs add column if not exists contact_nom text;
alter table public.preteurs add column if not exists contact_email text;
alter table public.preteurs add column if not exists contact_tel text;
alter table public.preteurs add column if not exists notes text;
alter table public.preteurs add column if not exists actif boolean default true;
alter table public.preteurs add column if not exists created_at timestamptz default now();

-- Ancien check courtier_tables.sql : 'privé' — le retirer AVANT le remap
select pg_temp.drop_checks('preteurs', 'type');

update public.preteurs set type = 'prive' where type = 'privé';

do $$
begin
  if not exists (
    select 1 from public.preteurs
    where type is not null
      and type not in ('banque', 'caisse', 'prive', 'assureur', 'autre')
  ) then
    alter table public.preteurs
      add constraint preteurs_type_check
      check (type is null or type in ('banque', 'caisse', 'prive', 'assureur', 'autre'));
  end if;
end $$;

create index if not exists idx_preteurs_company on public.preteurs(company_id);

alter table public.preteurs enable row level security;

drop policy if exists "preteurs_select" on public.preteurs;
drop policy if exists "preteurs_insert" on public.preteurs;
drop policy if exists "preteurs_update" on public.preteurs;
drop policy if exists "preteurs_delete" on public.preteurs;
drop policy if exists "preteurs_isolation" on public.preteurs;

create policy "preteurs_isolation" on public.preteurs
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

-- ── 3. DOSSIERS ──────────────────────────────────────────────────────
create table if not exists public.dossiers (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  client_id        uuid references public.clients(id) on delete set null,
  preteur_id       uuid references public.preteurs(id) on delete set null,
  assigned_to      uuid references public.profiles(id) on delete set null,
  numero           text not null,
  phase            text default 'prise_en_charge',
  etiquette        text default 'nouveau_lead',
  type_transaction text default 'achat',
  montant_pret     numeric(14,2),
  taux             numeric(5,3),
  taux_commission  numeric(6,4),
  commission_brute numeric(12,2),
  date_soumission  date,
  date_approbation date,
  date_notariat    date,
  date_cloture     date,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.dossiers add column if not exists client_id uuid;
alter table public.dossiers add column if not exists preteur_id uuid;
alter table public.dossiers add column if not exists assigned_to uuid;
alter table public.dossiers add column if not exists numero text;
alter table public.dossiers add column if not exists phase text default 'prise_en_charge';
alter table public.dossiers add column if not exists etiquette text default 'nouveau_lead';
-- Sans DEFAULT ici : sinon case B remplirait 'achat' et écraserait le remap type_pret
alter table public.dossiers add column if not exists type_transaction text;
alter table public.dossiers add column if not exists montant_pret numeric(14,2);
alter table public.dossiers add column if not exists taux numeric(5,3);
alter table public.dossiers add column if not exists taux_commission numeric(6,4);
alter table public.dossiers add column if not exists commission_brute numeric(12,2);
alter table public.dossiers add column if not exists date_soumission date;
alter table public.dossiers add column if not exists date_approbation date;
alter table public.dossiers add column if not exists date_notariat date;
alter table public.dossiers add column if not exists date_cloture date;
alter table public.dossiers add column if not exists notes text;
alter table public.dossiers add column if not exists created_at timestamptz default now();
alter table public.dossiers add column if not exists updated_at timestamptz default now();

-- FK si les colonnes existaient déjà sans contrainte
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dossiers' and column_name = 'assigned_to'
  ) and not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dossiers'::regclass
      and contype = 'f'
      and conname = 'dossiers_assigned_to_fkey'
  ) then
    alter table public.dossiers
      add constraint dossiers_assigned_to_fkey
      foreign key (assigned_to) references public.profiles(id) on delete set null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dossiers' and column_name = 'client_id'
  ) and not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dossiers'::regclass
      and contype = 'f'
      and conname = 'dossiers_client_id_fkey'
  ) then
    alter table public.dossiers
      add constraint dossiers_client_id_fkey
      foreign key (client_id) references public.clients(id) on delete set null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dossiers' and column_name = 'preteur_id'
  ) and not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dossiers'::regclass
      and contype = 'f'
      and conname = 'dossiers_preteur_id_fkey'
  ) then
    alter table public.dossiers
      add constraint dossiers_preteur_id_fkey
      foreign key (preteur_id) references public.preteurs(id) on delete set null;
  end if;
end $$;

-- Case B : copier les anciennes colonnes, garder les sources
select pg_temp.copy_col('dossiers', 'type_pret', 'type_transaction');
select pg_temp.copy_col('dossiers', 'montant', 'montant_pret');
select pg_temp.copy_col('dossiers', 'date_financement', 'date_cloture');

update public.dossiers
   set type_transaction = 'achat'
 where type_transaction is null;

alter table public.dossiers alter column type_transaction set default 'achat';
alter table public.dossiers alter column phase set default 'prise_en_charge';
alter table public.dossiers alter column etiquette set default 'nouveau_lead';
-- Retirer le défaut aléatoire DOS-YYMMDD-RAND (schema-agence) pour laisser le trigger séquentiel
alter table public.dossiers alter column numero drop default;

select pg_temp.drop_checks('dossiers', 'phase');
select pg_temp.drop_checks('dossiers', 'type_transaction');

do $$
begin
  if not exists (
    select 1 from public.dossiers
    where phase is not null
      and phase not in ('prise_en_charge', 'montage', 'soumission', 'approbation', 'finalisation')
  ) then
    alter table public.dossiers
      add constraint dossiers_phase_check
      check (phase is null or phase in (
        'prise_en_charge', 'montage', 'soumission', 'approbation', 'finalisation'
      ));
  end if;

  if not exists (
    select 1 from public.dossiers
    where type_transaction is not null
      and type_transaction not in ('achat', 'renouvellement', 'refinancement', 'transfert')
  ) then
    alter table public.dossiers
      add constraint dossiers_type_transaction_check
      check (type_transaction is null or type_transaction in (
        'achat', 'renouvellement', 'refinancement', 'transfert'
      ));
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.dossiers'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) like '%company_id%'
      and pg_get_constraintdef(oid) like '%numero%'
  ) or exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'dossiers'
      and indexname in ('dossiers_company_numero_key', 'dossiers_company_id_numero_key')
  ) then
    null;
  elsif exists (
    select 1 from public.dossiers
    group by company_id, numero
    having count(*) > 1
  ) then
    raise notice 'dossiers: doublons (company_id, numero) — index unique non créé';
  else
    create unique index dossiers_company_numero_key
      on public.dossiers (company_id, numero);
  end if;
end $$;

create index if not exists idx_dossiers_company     on public.dossiers(company_id);
create index if not exists idx_dossiers_client      on public.dossiers(client_id);
create index if not exists idx_dossiers_phase       on public.dossiers(phase);
create index if not exists idx_dossiers_assigned_to on public.dossiers(assigned_to);

create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_dossier_numero()
returns trigger
language plpgsql as $$
declare
  yr  text := to_char(now(), 'YYYY');
  seq int;
begin
  select count(*) + 1 into seq
    from public.dossiers
   where company_id = new.company_id
     and extract(year from created_at) = extract(year from now());
  new.numero := 'DOS-' || yr || '-' || lpad(seq::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists dossiers_updated_at on public.dossiers;
create trigger dossiers_updated_at
  before update on public.dossiers
  for each row execute function public.set_updated_at();

drop trigger if exists dossiers_numero_trigger on public.dossiers;
create trigger dossiers_numero_trigger
  before insert on public.dossiers
  for each row
  when (new.numero is null or new.numero = '')
  execute function public.generate_dossier_numero();

alter table public.dossiers enable row level security;

drop policy if exists "dossiers_select" on public.dossiers;
drop policy if exists "dossiers_insert" on public.dossiers;
drop policy if exists "dossiers_update" on public.dossiers;
drop policy if exists "dossiers_delete" on public.dossiers;
drop policy if exists "dossiers_isolation" on public.dossiers;

create policy "dossiers_isolation" on public.dossiers
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

-- ── 4. COMMISSIONS ───────────────────────────────────────────────────
create table if not exists public.commissions (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  dossier_id   uuid references public.dossiers(id) on delete set null,
  preteur_id   uuid references public.preteurs(id) on delete set null,
  montant      numeric(14,2) not null,
  statut       text default 'a_recevoir',
  date_prevue  date,
  date_recue   date,
  notes        text,
  created_at   timestamptz default now()
);

alter table public.commissions add column if not exists dossier_id uuid;
alter table public.commissions add column if not exists preteur_id uuid;
alter table public.commissions add column if not exists montant numeric(14,2);
alter table public.commissions add column if not exists statut text;
alter table public.commissions add column if not exists date_prevue date;
alter table public.commissions add column if not exists date_recue date;
alter table public.commissions add column if not exists notes text;
alter table public.commissions add column if not exists created_at timestamptz default now();

alter table public.commissions alter column montant type numeric(14,2);

-- Ancien check (en_attente / reçue / annulée) — drop AVANT le remap
select pg_temp.drop_checks('commissions', 'statut');

update public.commissions set statut = 'a_recevoir' where statut = 'en_attente';
update public.commissions set statut = 'recu'       where statut in ('reçue', 'recue');
update public.commissions set statut = 'annule'     where statut in ('annulée', 'annulee');

select pg_temp.copy_col('commissions', 'date_paiement', 'date_prevue');

update public.commissions set statut = 'a_recevoir' where statut is null;
alter table public.commissions alter column statut set default 'a_recevoir';

do $$
begin
  if not exists (
    select 1 from public.commissions
    where statut is not null
      and statut not in ('a_recevoir', 'recu', 'annule')
  ) then
    alter table public.commissions
      add constraint commissions_statut_check
      check (statut is null or statut in ('a_recevoir', 'recu', 'annule'));
  end if;
end $$;

create index if not exists idx_commissions_company on public.commissions(company_id);
create index if not exists idx_commissions_dossier on public.commissions(dossier_id);

alter table public.commissions enable row level security;

drop policy if exists "commissions_select" on public.commissions;
drop policy if exists "commissions_insert" on public.commissions;
drop policy if exists "commissions_update" on public.commissions;
drop policy if exists "commissions_delete" on public.commissions;
drop policy if exists "commissions_isolation" on public.commissions;

create policy "commissions_isolation" on public.commissions
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());

-- ── 5. DOSSIER_ASSIGNMENTS (collab, calqué sur job_assignments) ──────
create table if not exists public.dossier_assignments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  dossier_id  uuid not null references public.dossiers(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (dossier_id, profile_id)
);

create unique index if not exists dossier_assignments_dossier_id_profile_id_key
  on public.dossier_assignments (dossier_id, profile_id);
create index if not exists idx_dossier_assignments_profile
  on public.dossier_assignments(profile_id, company_id);
create index if not exists idx_dossier_assignments_dossier
  on public.dossier_assignments(dossier_id);

alter table public.dossier_assignments enable row level security;

drop policy if exists "dossier_assignments_select_company" on public.dossier_assignments;
create policy "dossier_assignments_select_company" on public.dossier_assignments
  for select using (company_id = get_my_company_id());

drop policy if exists "dossier_assignments_admin_all" on public.dossier_assignments;
create policy "dossier_assignments_admin_all" on public.dossier_assignments
  for all using (
    company_id = get_my_company_id()
    and (select role from public.profiles where id = auth.uid()) in ('owner', 'admin')
  )
  with check (
    company_id = get_my_company_id()
    and (select role from public.profiles where id = auth.uid()) in ('owner', 'admin')
  );

-- ── 6. DOSSIER_DOCUMENTS (checklist pièces QC) ───────────────────────
create table if not exists public.dossier_documents (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  dossier_id  uuid not null references public.dossiers(id) on delete cascade,
  type        text not null,
  titre       text not null,
  recu        boolean default false,
  file_url    text,
  notes       text,
  created_at  timestamptz default now()
);

alter table public.dossier_documents add column if not exists company_id uuid;
alter table public.dossier_documents add column if not exists dossier_id uuid;
alter table public.dossier_documents add column if not exists type text;
alter table public.dossier_documents add column if not exists titre text;
alter table public.dossier_documents add column if not exists recu boolean default false;
alter table public.dossier_documents add column if not exists file_url text;
alter table public.dossier_documents add column if not exists notes text;
alter table public.dossier_documents add column if not exists created_at timestamptz default now();

select pg_temp.drop_checks('dossier_documents', 'type');

do $$
begin
  if not exists (
    select 1 from public.dossier_documents
    where type is not null
      and type not in (
        't4', 'releve1', 'avis_cotisation', 'releve_bancaire',
        'piece_id', 'mandat', 'promesse_achat', 'evaluation', 'autre'
      )
  ) then
    alter table public.dossier_documents
      add constraint dossier_documents_type_check
      check (type in (
        't4', 'releve1', 'avis_cotisation', 'releve_bancaire',
        'piece_id', 'mandat', 'promesse_achat', 'evaluation', 'autre'
      ));
  end if;
end $$;

create index if not exists idx_dossier_documents_company on public.dossier_documents(company_id);
create index if not exists idx_dossier_documents_dossier on public.dossier_documents(dossier_id);

alter table public.dossier_documents enable row level security;

drop policy if exists "dossier_documents_isolation" on public.dossier_documents;
create policy "dossier_documents_isolation" on public.dossier_documents
  for all using (company_id = get_my_company_id())
  with check (company_id = get_my_company_id());
