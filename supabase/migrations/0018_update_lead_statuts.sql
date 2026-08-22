-- Migration 0018: Mise à jour des statuts du pipeline de leads dans platform_leads

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'platform_leads_statut_check'
  ) THEN
    ALTER TABLE public.platform_leads DROP CONSTRAINT platform_leads_statut_check;
  END IF;
END $$;

ALTER TABLE public.platform_leads 
  ADD CONSTRAINT platform_leads_statut_check 
  CHECK (statut IN (
    'incomplet',
    'nouveau',
    'tentative_1',
    'tentative_2',
    'contacte',
    'qualifie',
    'essai',
    'en_attente_paiement',
    'client',
    'perdu',
    'sans_suite'
  ));
