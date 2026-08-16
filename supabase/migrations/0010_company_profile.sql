-- Colonnes profil organisation manquantes (paramètres ERP)
alter table public.companies
  add column if not exists email text,
  add column if not exists nom_legal text,
  add column if not exists site_web text,
  add column if not exists rbq_no text,
  add column if not exists neq text,
  add column if not exists mode_paiement_defaut text default 'virement',
  add column if not exists delai_paiement int default 30,
  add column if not exists notes_pied_devis text,
  add column if not exists notes_pied_facture text,
  add column if not exists couleur_accent text default '#C9A84C',
  add column if not exists updated_at timestamptz default now();
