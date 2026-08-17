-- Si le courriel a une invitation en cours, on rattache à cette équipe
-- au lieu de créer une nouvelle compagnie (Natasha / employés).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  inv_id uuid;
  inv_company_id uuid;
  inv_role text;
begin
  select i.id, i.company_id, i.role
    into inv_id, inv_company_id, inv_role
  from public.invitations i
  where lower(i.email) = lower(new.email)
    and coalesce(i.accepted, false) = false
    and i.expires_at > now()
  order by i.created_at desc
  limit 1;

  if inv_id is not null then
    insert into public.profiles (id, company_id, full_name, role)
    values (
      new.id,
      inv_company_id,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      coalesce(nullif(inv_role, ''), 'collaborateur')
    );
    update public.invitations set accepted = true where id = inv_id;
    return new;
  end if;

  insert into public.companies (name, telephone, ville, vertical, team_size)
  values (
    coalesce(new.raw_user_meta_data->>'company_name', 'Mon Entreprise'),
    new.raw_user_meta_data->>'telephone',
    new.raw_user_meta_data->>'ville',
    coalesce(new.raw_user_meta_data->>'vertical', 'construction'),
    new.raw_user_meta_data->>'team_size'
  )
  returning id into new_company_id;

  insert into public.profiles (id, company_id, full_name, role)
  values (
    new.id,
    new_company_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  insert into public.subscriptions (company_id, status, trial_end)
  values (new_company_id, 'trialing', now() + interval '14 days');

  return new;
end;
$$;
