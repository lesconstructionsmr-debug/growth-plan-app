-- Migration 0022: Atomic Document Numbering Counters & Unique Constraints

-- 1. Create company_counters table for atomic document sequence generation
CREATE TABLE IF NOT EXISTS public.company_counters (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  year_val INT NOT NULL,
  last_val INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, doc_type, year_val)
);

ALTER TABLE public.company_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRUD company_counters" ON public.company_counters;
CREATE POLICY "CRUD company_counters" ON public.company_counters
  FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- 2. Stored function for atomic next document number retrieval
CREATE OR REPLACE FUNCTION public.get_next_document_number(
  p_company_id UUID,
  p_doc_type TEXT,
  p_year INT,
  p_prefix TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_next_val INT;
  v_prefix TEXT;
  v_result TEXT;
BEGIN
  -- Default prefix based on doc_type
  IF p_prefix IS NOT NULL AND length(trim(p_prefix)) > 0 THEN
    v_prefix := p_prefix;
  ELSIF p_doc_type = 'facture' THEN
    v_prefix := 'FAC';
  ELSIF p_doc_type = 'devis' THEN
    v_prefix := 'DEV';
  ELSE
    v_prefix := UPPER(p_doc_type);
  END IF;

  -- Atomic increment with upsert
  INSERT INTO public.company_counters (company_id, doc_type, year_val, last_val, updated_at)
  VALUES (p_company_id, p_doc_type, p_year, 1, NOW())
  ON CONFLICT (company_id, doc_type, year_val)
  DO UPDATE SET
    last_val = company_counters.last_val + 1,
    updated_at = NOW()
  RETURNING last_val INTO v_next_val;

  v_result := v_prefix || '-' || p_year || '-' || LPAD(v_next_val::TEXT, 3, '0');
  RETURN v_result;
END;
$$;

-- Grant execution to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.get_next_document_number(UUID, TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_document_number(UUID, TEXT, INT, TEXT) TO service_role;
