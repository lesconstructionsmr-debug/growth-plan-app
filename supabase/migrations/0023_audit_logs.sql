-- Migration 0023: Immutable Audit Logs for Legal & Financial Compliance (Loi 25 Québec)

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexation performante pour les pistes d'audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_entity 
  ON public.audit_logs(company_id, entity_type, entity_id, created_at DESC);

-- Sécurisation Multi-Tenant via RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRUD audit_logs" ON public.audit_logs;
CREATE POLICY "CRUD audit_logs" ON public.audit_logs 
  FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- Les logs ne doivent jamais être modifiés par un utilisateur standard (Append-Only)
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
