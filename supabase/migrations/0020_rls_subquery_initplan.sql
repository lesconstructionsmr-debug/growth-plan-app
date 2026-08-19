-- Migration 0020: RLS Subquery InitPlan Optimization
-- Forces PostgreSQL to evaluate get_my_company_id() once per query execution (InitPlan)
-- instead of re-evaluating it for every scanned row (SubPlan).

-- 1. Re-create policies for companies and profiles
DROP POLICY IF EXISTS "Voir sa compagnie" ON public.companies;
CREATE POLICY "Voir sa compagnie" ON public.companies FOR SELECT USING (id = (SELECT get_my_company_id()));

DROP POLICY IF EXISTS "Modifier sa compagnie" ON public.companies;
CREATE POLICY "Modifier sa compagnie" ON public.companies FOR UPDATE USING (id = (SELECT get_my_company_id()));

DROP POLICY IF EXISTS "Voir les profils de son entreprise" ON public.profiles;
CREATE POLICY "Voir les profils de son entreprise" ON public.profiles FOR SELECT USING (id = auth.uid() OR company_id = (SELECT get_my_company_id()));

-- 2. Re-create policies for multi-tenant tables using scalar subqueries (SELECT get_my_company_id())

-- clients
DROP POLICY IF EXISTS "CRUD clients" ON public.clients;
CREATE POLICY "CRUD clients" ON public.clients FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- jobs
DROP POLICY IF EXISTS "CRUD jobs" ON public.jobs;
CREATE POLICY "CRUD jobs" ON public.jobs FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- devis
DROP POLICY IF EXISTS "CRUD devis" ON public.devis;
CREATE POLICY "CRUD devis" ON public.devis FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- factures
DROP POLICY IF EXISTS "CRUD factures" ON public.factures;
CREATE POLICY "CRUD factures" ON public.factures FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- leads
DROP POLICY IF EXISTS "CRUD leads" ON public.leads;
CREATE POLICY "CRUD leads" ON public.leads FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- employes
DROP POLICY IF EXISTS "CRUD employes" ON public.employes;
CREATE POLICY "CRUD employes" ON public.employes FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- depenses
DROP POLICY IF EXISTS "CRUD depenses" ON public.depenses;
CREATE POLICY "CRUD depenses" ON public.depenses FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- notes
DROP POLICY IF EXISTS "CRUD notes" ON public.notes;
CREATE POLICY "CRUD notes" ON public.notes FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- invitations
DROP POLICY IF EXISTS "CRUD invitations" ON public.invitations;
CREATE POLICY "CRUD invitations" ON public.invitations FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- subscriptions
DROP POLICY IF EXISTS "Voir son abonnement" ON public.subscriptions;
DROP POLICY IF EXISTS "Modifier son abonnement" ON public.subscriptions;
DROP POLICY IF EXISTS "CRUD subscriptions" ON public.subscriptions;
CREATE POLICY "CRUD subscriptions" ON public.subscriptions FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- sous_traitants
DROP POLICY IF EXISTS "CRUD sous_traitants" ON public.sous_traitants;
CREATE POLICY "CRUD sous_traitants" ON public.sous_traitants FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- relances
DROP POLICY IF EXISTS "CRUD relances" ON public.relances;
CREATE POLICY "CRUD relances" ON public.relances FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- job_assignments
DROP POLICY IF EXISTS "job_assignments_select_company" ON public.job_assignments;
DROP POLICY IF EXISTS "job_assignments_admin_all" ON public.job_assignments;
DROP POLICY IF EXISTS "CRUD job_assignments" ON public.job_assignments;
CREATE POLICY "CRUD job_assignments" ON public.job_assignments FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- job_documents
DROP POLICY IF EXISTS "CRUD job_documents" ON public.job_documents;
CREATE POLICY "CRUD job_documents" ON public.job_documents FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- pointages
DROP POLICY IF EXISTS "CRUD pointages" ON public.pointages;
CREATE POLICY "CRUD pointages" ON public.pointages FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- qc_ccq_entries
DROP POLICY IF EXISTS "CRUD qc_ccq_entries" ON public.qc_ccq_entries;
CREATE POLICY "CRUD qc_ccq_entries" ON public.qc_ccq_entries FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- qc_retenues
DROP POLICY IF EXISTS "CRUD qc_retenues" ON public.qc_retenues;
CREATE POLICY "CRUD qc_retenues" ON public.qc_retenues FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- qc_seao_avis
DROP POLICY IF EXISTS "CRUD qc_seao_avis" ON public.qc_seao_avis;
CREATE POLICY "CRUD qc_seao_avis" ON public.qc_seao_avis FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- preteurs
DROP POLICY IF EXISTS "preteurs_isolation" ON public.preteurs;
DROP POLICY IF EXISTS "CRUD preteurs" ON public.preteurs;
CREATE POLICY "CRUD preteurs" ON public.preteurs FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- dossiers
DROP POLICY IF EXISTS "dossiers_isolation" ON public.dossiers;
DROP POLICY IF EXISTS "CRUD dossiers" ON public.dossiers;
CREATE POLICY "CRUD dossiers" ON public.dossiers FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- commissions
DROP POLICY IF EXISTS "commissions_isolation" ON public.commissions;
DROP POLICY IF EXISTS "CRUD commissions" ON public.commissions;
CREATE POLICY "CRUD commissions" ON public.commissions FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- dossier_assignments
DROP POLICY IF EXISTS "dossier_assignments_select_company" ON public.dossier_assignments;
DROP POLICY IF EXISTS "dossier_assignments_admin_all" ON public.dossier_assignments;
DROP POLICY IF EXISTS "CRUD dossier_assignments" ON public.dossier_assignments;
CREATE POLICY "CRUD dossier_assignments" ON public.dossier_assignments FOR ALL USING (company_id = (SELECT get_my_company_id()));

-- dossier_documents
DROP POLICY IF EXISTS "dossier_documents_isolation" ON public.dossier_documents;
DROP POLICY IF EXISTS "CRUD dossier_documents" ON public.dossier_documents;
CREATE POLICY "CRUD dossier_documents" ON public.dossier_documents FOR ALL USING (company_id = (SELECT get_my_company_id()));
