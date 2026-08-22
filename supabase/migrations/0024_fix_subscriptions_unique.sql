-- Migration 0024: Ensure UNIQUE constraint on subscriptions.company_id for idempotent Stripe webhooks

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_company_id_key'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions 
      ADD CONSTRAINT subscriptions_company_id_key UNIQUE (company_id);
  END IF;
END $$;
