-- ══════════════════════════════════════════════════════════════════════
-- MIGRATION AUDIT "SANS PITIÉ" — Partie 1 à 3
-- Coller dans Supabase → SQL Editor → Run
-- Date : 2026-07-17
-- ══════════════════════════════════════════════════════════════════════

-- PARTIE 1 : FIX RLS PROFILES
drop policy if exists "Voir son profil" on public.profiles;
create policy "Voir les profils de son entreprise" on public.profiles
  for select using (
    id = auth.uid()
    OR company_id = get_my_company_id()
  );

-- PARTIE 2 : FIX WEBHOOK STRIPE
alter table public.subscriptions
  add constraint if not exists subscriptions_company_id_key
  unique (company_id);

-- PARTIE 3 : FIX COLLISIONS NUMEROS
alter table public.devis
  add constraint if not exists devis_company_numero_unique
  unique (company_id, numero);

alter table public.factures
  add constraint if not exists factures_company_numero_unique
  unique (company_id, numero);

-- VALIDATION
select conname, contype, conrelid::regclass from pg_constraint
where conrelid::regclass in (
  'public.subscriptions'::regclass,
  'public.devis'::regclass,
  'public.factures'::regclass
) and contype = 'u';
select schemaname, tablename, policyname, cmd, qual
from pg_policies where tablename = 'profiles';
