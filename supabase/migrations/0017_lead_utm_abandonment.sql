-- Migration 0017: Ajout du suivi des UTMs et de l'abandon de formulaire pour platform_leads

ALTER TABLE public.platform_leads
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS abandoned_at timestamptz;

-- Mise à jour du statut check constraint s'il existe
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
  CHECK (statut IN ('incomplet', 'nouveau', 'contacte', 'qualifie', 'essai', 'client', 'perdu'));
