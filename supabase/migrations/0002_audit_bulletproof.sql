-- ══════════════════════════════════════════════════════════════════════
-- MIGRATION 0002 — Fixes Audit "Sans Pitié" 2026-07-17
-- - RLS profiles équipe
-- - Contrainte unique subscriptions.company_id
-- - Index de performance manquants
-- ══════════════════════════════════════════════════════════════════════

-- Fix RLS profiles
drop policy if exists "Voir son profil" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "Voir les profils de son entreprise" on public.profiles;
create policy "Voir les profils de son entreprise" on public.profiles
  for select using (id = auth.uid() OR company_id = get_my_company_id());

-- Fix Stripe webhook (unicité company_id sur subscriptions)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscriptions_company_id_key'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions add constraint subscriptions_company_id_key unique (company_id);
  end if;
end $$;

-- Fix collisions numéros devis/factures
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'devis_company_numero_unique'
    and conrelid = 'public.devis'::regclass)
  then alter table public.devis add constraint devis_company_numero_unique unique (company_id, numero);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'factures_company_numero_unique'
    and conrelid = 'public.factures'::regclass)
  then alter table public.factures add constraint factures_company_numero_unique unique (company_id, numero);
  end if;
end $$;

-- Index de performance
create index if not exists idx_devis_portal_token          on public.devis    (portal_token);
create index if not exists idx_devis_company_id_created    on public.devis    (company_id, created_at desc);
create index if not exists idx_devis_company_numero        on public.devis    (company_id, numero);
create index if not exists idx_devis_client_id             on public.devis    (client_id);
create index if not exists idx_factures_company_id_created on public.factures (company_id, created_at desc);
create index if not exists idx_factures_company_numero     on public.factures (company_id, numero);
create index if not exists idx_factures_client_id          on public.factures (client_id);
create index if not exists idx_factures_devis_id           on public.factures (devis_id);
create index if not exists idx_jobs_company_id             on public.jobs     (company_id);
create index if not exists idx_jobs_client_id              on public.jobs     (client_id);
create index if not exists idx_leads_company_id            on public.leads    (company_id);
create index if not exists idx_notes_company_id            on public.notes    (company_id);
create index if not exists idx_notes_client_id             on public.notes    (client_id);
create index if not exists idx_depenses_company_id         on public.depenses (company_id);
create index if not exists idx_employes_company_id         on public.employes (company_id);
