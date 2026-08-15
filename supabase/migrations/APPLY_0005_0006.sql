-- ══════════════════════════════════════════════════════════════════
-- APPLY 0005 + 0006 — Coller ce fichier entier dans Supabase SQL Editor
-- Dashboard → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════════════════

-- ── 0005 : Portail devis RPC ──────────────────────────────────────

create or replace function public.portal_get_devis(p_token text)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  result json;
begin
  if p_token is null or length(trim(p_token)) < 32 then
    return null;
  end if;

  select json_build_object(
    'id',              d.id,
    'numero',          d.numero,
    'titre',           d.titre,
    'statut',          d.statut,
    'lignes',          d.lignes,
    'date_emission',   d.date_emission,
    'valide_jusqu_au', d.valide_jusqu_au,
    'montant_ht',      d.montant_ht,
    'tps',             d.tps,
    'tvq',             d.tvq,
    'montant_ttc',     d.montant_ttc,
    'notes',           d.notes,
    'portal_token',    d.portal_token,
    'clients', case when c.id is not null then json_build_object(
      'nom', c.nom, 'email', c.email, 'telephone', c.telephone, 'adresse', c.adresse
    ) else null end,
    'companies', case when co.id is not null then json_build_object(
      'name', co.name, 'telephone', co.telephone, 'adresse', co.adresse,
      'tps_no', co.tps_no, 'tvq_no', co.tvq_no
    ) else null end
  )
  into result
  from public.devis d
  left join public.clients c    on c.id  = d.client_id
  left join public.companies co on co.id = d.company_id
  where d.portal_token = p_token;

  return result;
end;
$$;

create or replace function public.portal_update_devis(
  p_token           text,
  p_action          text,
  p_motif           text default null,
  p_signature_data  text default null,
  p_signataire_nom  text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_devis public.devis%rowtype;
begin
  if p_token is null or length(trim(p_token)) < 32 then
    raise exception 'Token invalide' using errcode = '22023';
  end if;
  if p_action not in ('approuve', 'refuse') then
    raise exception 'action invalide' using errcode = '22023';
  end if;

  select * into v_devis from public.devis where portal_token = p_token for update;
  if not found then raise exception 'Devis introuvable' using errcode = 'P0002'; end if;
  if v_devis.statut not in ('envoye', 'vu', 'brouillon') then
    raise exception 'Ce devis a déjà été traité' using errcode = '22023';
  end if;

  update public.devis set
    statut         = p_action,
    updated_at     = now(),
    approuve_le    = case when p_action = 'approuve' then now() else approuve_le end,
    signature_data = case when p_action = 'approuve' and p_signature_data is not null then p_signature_data else signature_data end,
    signataire_nom = case when p_action = 'approuve' and p_signataire_nom is not null then p_signataire_nom else signataire_nom end,
    signe_le       = case when p_action = 'approuve' and p_signature_data is not null then now() else signe_le end
  where portal_token = p_token;

  return json_build_object(
    'success', true, 'action', p_action, 'devis_id', v_devis.id,
    'client_nom',   (select nom   from public.clients   where id = v_devis.client_id),
    'client_email', (select email from public.clients   where id = v_devis.client_id),
    'company_name', (select name  from public.companies where id = v_devis.company_id)
  );
end;
$$;

revoke all on function public.portal_get_devis(text) from public;
grant execute on function public.portal_get_devis(text) to anon, authenticated, service_role;
revoke all on function public.portal_update_devis(text, text, text, text, text) from public;
grant execute on function public.portal_update_devis(text, text, text, text, text) to anon, authenticated, service_role;

-- ── 0006 : Normalisation statuts ──────────────────────────────────

update public.devis    set statut = 'envoye'    where statut in ('envoyé', 'Envoyé');
update public.devis    set statut = 'approuve'  where statut in ('approuvé', 'Approuvé');
update public.devis    set statut = 'refuse'    where statut in ('refusé', 'Refusé');
update public.factures set statut = 'envoyee'   where statut in ('envoyée', 'Envoyée');
update public.factures set statut = 'payee'     where statut in ('payée', 'Payée');
update public.factures set statut = 'annulee'   where statut in ('annulée', 'Annulée');
update public.factures set statut = 'en_retard' where statut = 'en retard';

comment on column public.devis.statut is
  'brouillon | envoye | vu | approuve | refuse | expire | converti';
comment on column public.factures.statut is
  'brouillon | envoyee | vue | partielle | payee | en_retard | annulee';
