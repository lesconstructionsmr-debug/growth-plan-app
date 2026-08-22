-- Migration 0025: Add composite UNIQUE constraint (company_id, numero) on devis and factures

DO $$
BEGIN
  -- 1. Contrainte d'unicité pour les devis
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_devis_company_numero'
      AND conrelid = 'public.devis'::regclass
  ) THEN
    ALTER TABLE public.devis
      ADD CONSTRAINT uq_devis_company_numero UNIQUE (company_id, numero);
  END IF;

  -- 2. Contrainte d'unicité pour les factures
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_factures_company_numero'
      AND conrelid = 'public.factures'::regclass
  ) THEN
    ALTER TABLE public.factures
      ADD CONSTRAINT uq_factures_company_numero UNIQUE (company_id, numero);
  END IF;
END $$;
