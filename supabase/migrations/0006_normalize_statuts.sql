-- Normalise les statuts devis/factures vers la convention sans accents (ASCII).
-- Convention : brouillon | envoye | vu | approuve | refuse | expire | converti
--              brouillon | envoyee | vue | partielle | payee | en_retard | annulee

update public.devis set statut = 'envoye'    where statut in ('envoyé', 'Envoyé');
update public.devis set statut = 'approuve'  where statut in ('approuvé', 'Approuvé');
update public.devis set statut = 'refuse'    where statut in ('refusé', 'Refusé');
update public.devis set statut = 'converti'  where statut in ('converti', 'Converti');

update public.factures set statut = 'envoyee'   where statut in ('envoyée', 'Envoyée');
update public.factures set statut = 'payee'     where statut in ('payée', 'Payée');
update public.factures set statut = 'annulee'   where statut in ('annulée', 'Annulée');
update public.factures set statut = 'en_retard' where statut in ('en retard');

comment on column public.devis.statut is
  'brouillon | envoye | vu | approuve | refuse | expire | converti';
comment on column public.factures.statut is
  'brouillon | envoyee | vue | partielle | payee | en_retard | annulee';
