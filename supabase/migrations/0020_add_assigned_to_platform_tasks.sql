-- ------------------------------------------------------------------
-- 0020 — Ajout du champ Responsable sur les tâches du Centre de Contrôle
--
-- Exécution : Supabase ? SQL Editor ? New query ? coller ? Run.
-- ------------------------------------------------------------------

ALTER TABLE public.platform_tasks 
ADD COLUMN IF NOT EXISTS assigned_to text;

CREATE INDEX IF NOT EXISTS idx_platform_tasks_assigned_to 
ON public.platform_tasks(assigned_to);
