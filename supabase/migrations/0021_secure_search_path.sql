-- ══════════════════════════════════════════════════════════════════════
-- MIGRATION 0021 — Secure search_path on get_my_company_id()
-- Explicitly sets SET search_path = public on SECURITY DEFINER function
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;
