-- Migration 0026: Stripe Webhook Idempotency Table

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour nettoyage périodique si nécessaire
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed 
  ON public.stripe_webhook_events(processed_at DESC);

-- Sécurité RLS
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Seul le service_role peut insérer et lire les événements de webhooks Stripe
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;
GRANT ALL ON public.stripe_webhook_events TO service_role;
