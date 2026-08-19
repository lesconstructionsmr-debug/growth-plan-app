-- Migration 0019: Performance indexes for multi-tenant queries & RLS filtering

-- 1. Missing index for clients table
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);

-- 2. Composite multi-tenant indexes for frequent queries & RLS filtering
CREATE INDEX IF NOT EXISTS idx_devis_company_client ON public.devis(company_id, client_id);
CREATE INDEX IF NOT EXISTS idx_devis_company_statut ON public.devis(company_id, statut);

CREATE INDEX IF NOT EXISTS idx_factures_company_client ON public.factures(company_id, client_id);
CREATE INDEX IF NOT EXISTS idx_factures_company_devis ON public.factures(company_id, devis_id);
CREATE INDEX IF NOT EXISTS idx_factures_company_job ON public.factures(company_id, job_id);
CREATE INDEX IF NOT EXISTS idx_factures_company_statut ON public.factures(company_id, statut);

CREATE INDEX IF NOT EXISTS idx_jobs_company_client ON public.jobs(company_id, client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_statut ON public.jobs(company_id, statut);

CREATE INDEX IF NOT EXISTS idx_leads_company_statut ON public.leads(company_id, statut);

CREATE INDEX IF NOT EXISTS idx_depenses_company_job ON public.depenses(company_id, job_id);

CREATE INDEX IF NOT EXISTS idx_notes_company_client ON public.notes(company_id, client_id);
