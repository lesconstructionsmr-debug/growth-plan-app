-- ══════════════════════════════════════════════════════════════════
-- SEED DÉMO — Données réalistes pour démo client "Happy Path"
-- Colle dans Supabase → SQL Editor → Run
-- S'attache à la compagnie du compte peinture.jtl@gmail.com
-- Ré-exécutable : supprime les anciennes données démo avant d'insérer
-- ══════════════════════════════════════════════════════════════════

do $$
declare
  v_company_id uuid;
  v_client1 uuid;  -- Jean-François Morin (résidentiel)
  v_client2 uuid;  -- Constructions Bélanger (commercial)
  v_client3 uuid;  -- Sophie Lavallée (résidentiel)
  v_devis1 uuid;
  v_devis2 uuid;
  v_job1 uuid;
begin
  -- Trouver la compagnie du compte démo
  select p.company_id into v_company_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email = 'peinture.jtl@gmail.com';

  if v_company_id is null then
    raise exception 'Compagnie introuvable pour peinture.jtl@gmail.com';
  end if;

  -- Nettoyer les anciennes données démo (identifiées par le préfixe DEMO- des numéros)
  delete from public.factures where company_id = v_company_id and numero like 'FAC-DEMO-%';
  delete from public.devis    where company_id = v_company_id and numero like 'DEV-DEMO-%';
  delete from public.jobs     where company_id = v_company_id and titre like '[DÉMO]%';
  delete from public.clients  where company_id = v_company_id
    and email in ('jf.morin.demo@gmail.com', 'info.demo@constructionsbelanger.ca', 'sophie.lavallee.demo@outlook.com');

  -- ── 3 CLIENTS ──────────────────────────────────────────────────
  insert into public.clients (company_id, nom, email, telephone, adresse, ville, province, code_postal, notes)
  values (v_company_id, 'Jean-François Morin', 'jf.morin.demo@gmail.com', '514-555-2847',
          '1245 rue Sherbrooke Est', 'Montréal', 'QC', 'H2L 1M1',
          'Référé par un ancien client. Projet de rénovation cuisine + salle de bain.')
  returning id into v_client1;

  insert into public.clients (company_id, nom, email, telephone, adresse, ville, province, code_postal, notes)
  values (v_company_id, 'Constructions Bélanger inc.', 'info.demo@constructionsbelanger.ca', '450-555-9163',
          '3800 boul. Taschereau', 'Brossard', 'QC', 'J4V 2H9',
          'Entrepreneur général — sous-traitance peinture sur leurs chantiers multi-logements.')
  returning id into v_client2;

  insert into public.clients (company_id, nom, email, telephone, adresse, ville, province, code_postal, notes)
  values (v_company_id, 'Sophie Lavallée', 'sophie.lavallee.demo@outlook.com', '438-555-7412',
          '78 av. des Érables', 'Longueuil', 'QC', 'J4H 3K2',
          'Maison neuve — peinture complète intérieure avant emménagement (fin août).')
  returning id into v_client3;

  -- ── 1 JOB (chantier en cours) ─────────────────────────────────
  insert into public.jobs (company_id, client_id, titre, description, statut, date_debut, date_fin, budget, adresse)
  values (v_company_id, v_client2, '[DÉMO] Multi-logements Brossard — Phase 2',
          'Peinture complète de 12 unités, corridors et cages d''escalier. Blanc coquille murs, blanc pur plafonds.',
          'en_cours', current_date - 12, current_date + 18, 38500.00,
          '3800 boul. Taschereau, Brossard')
  returning id into v_job1;

  -- ── DEVIS 1 : approuvé (converti en facture) ──────────────────
  insert into public.devis (company_id, client_id, numero, titre, statut, lignes,
                            montant_ht, tps, tvq, montant_ttc, notes,
                            date_emission, valide_jusqu_au, envoye_le, approuve_le)
  values (v_company_id, v_client1, 'DEV-DEMO-001', 'Rénovation cuisine et salle de bain', 'converti',
          '[
            {"description": "Préparation des surfaces (sablage, plâtrage, apprêt)", "quantite": 1, "unite": "forfait", "prix_unitaire": 1450},
            {"description": "Peinture cuisine — murs et plafond (2 couches)", "quantite": 1, "unite": "forfait", "prix_unitaire": 1850},
            {"description": "Peinture salle de bain — hydrofuge", "quantite": 1, "unite": "forfait", "prix_unitaire": 975},
            {"description": "Peinture armoires de cuisine (laque)", "quantite": 22, "unite": "porte", "prix_unitaire": 95},
            {"description": "Protection et nettoyage de fin de chantier", "quantite": 1, "unite": "forfait", "prix_unitaire": 350}
          ]'::jsonb,
          6715.00, 335.75, 669.82, 7720.57,
          'Travaux réalisables en 5 jours ouvrables. Peinture Benjamin Moore incluse.',
          current_date - 21, current_date + 9, now() - interval '20 days', now() - interval '16 days')
  returning id into v_devis1;

  -- ── DEVIS 2 : envoyé (en attente de réponse) ──────────────────
  insert into public.devis (company_id, client_id, numero, titre, statut, lignes,
                            montant_ht, tps, tvq, montant_ttc, notes,
                            date_emission, valide_jusqu_au, envoye_le)
  values (v_company_id, v_client3, 'DEV-DEMO-002', 'Peinture intérieure complète — maison neuve', 'envoye',
          '[
            {"description": "Apprêt sur gypse neuf — toutes surfaces", "quantite": 2800, "unite": "pi²", "prix_unitaire": 0.85},
            {"description": "Peinture murs — 2 couches (couleurs au choix)", "quantite": 2800, "unite": "pi²", "prix_unitaire": 1.35},
            {"description": "Peinture plafonds — blanc plat", "quantite": 1400, "unite": "pi²", "prix_unitaire": 1.10},
            {"description": "Portes, cadrages et plinthes — laque blanche", "quantite": 14, "unite": "porte", "prix_unitaire": 125},
            {"description": "Escalier — rampe et limons", "quantite": 1, "unite": "forfait", "prix_unitaire": 650}
          ]'::jsonb,
          9950.00, 497.50, 992.51, 11440.01,
          'Prix valide 30 jours. Début des travaux possible 2 semaines après acceptation.',
          current_date - 4, current_date + 26, now() - interval '3 days')
  returning id into v_devis2;

  -- ── 1 FACTURE : issue du devis approuvé, envoyée ──────────────
  insert into public.factures (company_id, client_id, devis_id, numero, titre, statut, lignes,
                               montant_ht, tps, tvq, montant_ttc,
                               date_emission, date_echeance, notes)
  values (v_company_id, v_client1, v_devis1, 'FAC-DEMO-001', 'Rénovation cuisine et salle de bain', 'envoyee',
          '[
            {"description": "Préparation des surfaces (sablage, plâtrage, apprêt)", "quantite": 1, "unite": "forfait", "prix_unitaire": 1450},
            {"description": "Peinture cuisine — murs et plafond (2 couches)", "quantite": 1, "unite": "forfait", "prix_unitaire": 1850},
            {"description": "Peinture salle de bain — hydrofuge", "quantite": 1, "unite": "forfait", "prix_unitaire": 975},
            {"description": "Peinture armoires de cuisine (laque)", "quantite": 22, "unite": "porte", "prix_unitaire": 95},
            {"description": "Protection et nettoyage de fin de chantier", "quantite": 1, "unite": "forfait", "prix_unitaire": 350}
          ]'::jsonb,
          6715.00, 335.75, 669.82, 7720.57,
          current_date - 14, current_date + 16,
          'Paiement par virement Interac à info@peinturejtl.com ou par chèque.');

  -- ── 2 LEADS (pipeline vivant) ──────────────────────────────────
  delete from public.leads where company_id = v_company_id and email like '%.demo@%';
  insert into public.leads (company_id, nom, email, telephone, source, statut, valeur_estimee, notes)
  values
    (v_company_id, 'Marc Deschamps', 'm.deschamps.demo@gmail.com', '514-555-6021',
     'référence', 'qualifié', 4200.00, 'Condo à rafraîchir avant mise en vente. Rappeler jeudi.'),
    (v_company_id, 'Gestion Immobilière Rive-Sud', 'gestion.demo@girs.ca', '450-555-3388',
     'site_web', 'nouveau', 15000.00, 'Demande de soumission pour 3 immeubles locatifs.');

  raise notice 'Seed démo complété — compagnie %', v_company_id;
end $$;
