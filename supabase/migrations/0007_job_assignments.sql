-- Assignation employés → chantiers (RBAC Phase 2)
create table if not exists public.job_assignments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  job_id      uuid not null references public.jobs(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (job_id, profile_id)
);

create index if not exists idx_job_assignments_profile on public.job_assignments(profile_id, company_id);
create index if not exists idx_job_assignments_job on public.job_assignments(job_id);

alter table public.job_assignments enable row level security;

drop policy if exists "job_assignments_select_company" on public.job_assignments;
create policy "job_assignments_select_company" on public.job_assignments
  for select using (
    company_id = (select company_id from public.profiles where id = auth.uid())
  );

drop policy if exists "job_assignments_admin_all" on public.job_assignments;
create policy "job_assignments_admin_all" on public.job_assignments
  for all using (
    company_id = (select company_id from public.profiles where id = auth.uid())
    and (select role from public.profiles where id = auth.uid()) in ('owner', 'admin')
  );
