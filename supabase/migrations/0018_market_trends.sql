-- Migration 0018: Table pour stocker les indicateurs macroéconomiques du marché québécois

CREATE TABLE IF NOT EXISTS public.market_trends (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_ref     DATE NOT NULL,
  indicateur   TEXT NOT NULL,
  valeur       NUMERIC(12,2) NOT NULL,
  unite        TEXT NOT NULL,
  categorie    TEXT NOT NULL, -- 'matériaux' | 'logement' | 'taux'
  region       TEXT NOT NULL DEFAULT 'Québec',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.market_trends ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : accessible en lecture seule pour tout le monde (données publiques)
DROP POLICY IF EXISTS "market_trends_read_policy" ON public.market_trends;
CREATE POLICY "market_trends_read_policy" ON public.market_trends
  FOR SELECT USING (true);
