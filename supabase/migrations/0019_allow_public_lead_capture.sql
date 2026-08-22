-- Migration 0019: Politiques RLS permissives pour la capture publique des leads (Landing Page & Audit ROI)

-- 1. S'assurer que les colonnes nécessaires existent
ALTER TABLE public.platform_leads
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS abandoned_at timestamptz;

-- 2. Activer RLS
ALTER TABLE public.platform_leads ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes politiques si existantes
DROP POLICY IF EXISTS "Allow public insert on platform_leads" ON public.platform_leads;
DROP POLICY IF EXISTS "Allow public select on platform_leads" ON public.platform_leads;
DROP POLICY IF EXISTS "Allow public update on platform_leads" ON public.platform_leads;

-- 4. Créer les politiques RLS pour l'ingestion publique et la consultation admin/CRM
CREATE POLICY "Allow public insert on platform_leads"
  ON public.platform_leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public select on platform_leads"
  ON public.platform_leads
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public update on platform_leads"
  ON public.platform_leads
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
