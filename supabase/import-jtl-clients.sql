-- ══════════════════════════════════════════════════════════════════
-- IMPORT CLIENTS — Peinture JTL (migration ancienne app de gestion)
-- Colle dans Supabase → SQL Editor → Run
-- S'attache à la compagnie du compte peinture.jtl@gmail.com
-- Nettoyages appliqués :
--   • doublons fusionnés (Mario Lecompte, Karine Groleau, Irina)
--   • préfixe "mailto:" retiré, email incomplet "Div1981@" ignoré
--   • téléphones normalisés XXX-XXX-XXXX
--   • entreprise placée dans notes (pas de colonne dédiée)
--   • lignes sans nom ni contact ignorées
-- Ré-exécutable : ne réinsère pas un client dont l'email+nom existe déjà
-- ══════════════════════════════════════════════════════════════════

do $$
declare
  v_company_id uuid;
  v_inserted int;
begin
  select p.company_id into v_company_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email = 'peinture.jtl@gmail.com';

  if v_company_id is null then
    raise exception 'Compagnie introuvable pour peinture.jtl@gmail.com';
  end if;

  insert into public.clients (company_id, nom, email, telephone, adresse, ville, province, code_postal, notes)
  select v_company_id, t.nom, nullif(t.email,''), nullif(t.telephone,''), nullif(t.adresse,''), nullif(t.ville,''), 'QC', nullif(t.code_postal,''), nullif(t.notes,'')
  from (values
    ('9517-1260 QC inc — Boating Club',      'davidbourdeau@me.com',                '514-726-3328', '293-295 boulevard St-Rose',            'Sainte-Rose',                        'H7L 1M1', 'Entreprise : Boating Club'),
    ('9517-1260 QC inc — Patio Patio',       'davidbourdeau@me.com',                '514-830-2614', '2 boul. Curé-Labelle',                 'Sainte-Thérèse',                     'J7E 2W9', 'Entreprise : Patio Patio'),
    ('Alessandro',                           'mghattas76@gmail.com',                '514-757-2598', '17582 rue de Chenonceau',              'Mirabel',                            'J7J 0S3', null),
    ('Alex Grandmaison',                     'alex@grandmaison.net',                null,           null,                                    null,                                 null,      'Entreprise : Un toit sur ta tête'),
    ('Alexandre Sansregret',                 'alexandre@balsanconstruction.com',    '514-238-6625', null,                                    null,                                 null,      'Entreprise : Balsan'),
    ('Alexandre Payette',                    'alexandre_614@hotmail.com',           '438-862-0944', null,                                    null,                                 null,      null),
    ('Alix',                                 'alix@enixconstruction.com',           '514-479-9256', '3861 boul. Saint-Laurent',             'Montréal',                           'H2W 1K4', 'Entreprise : Enix'),
    ('Andréanne St-Onge',                    'andreanne.stonge1@hotmail.com',       null,           '6666 rue Marseille',                   'Montréal',                           'H1N 1M3', null),
    ('André Guilbault',                      'guilbault-andre@hotmail.com',         '514-577-4231', '5755 place Trenet',                    'Laval',                              'H7K 3Z1', null),
    ('André Nadeau',                         'paulandre.nadeau@gmail.com',          '514-755-8649', '135 rue Marcel-De La Sablonnière',     'Sainte-Thérèse',                     'J7E 0A2', null),
    ('Annabelle & Francis',                  'anna.beaudoin@icloud.com',            '514-378-5148', '234 ch. des Ancêtres',                 'Mont-Tremblant',                     'J8E 1H4', 'Tél. secondaire : 514-827-5191'),
    ('Annie Laurent',                        'annie.laurent@live.ca',               '514-501-6696', '53 rue Jacques',                       'Saint-Joseph-du-Lac',                'J0N 1M0', null),
    ('Bruno Santells',                       null,                                  '514-726-2802', '13780 du Merlot',                      null,                                 null,      null),
    ('Carolanne Durocher',                   'carolannedurocher@hotmail.com',       null,           '20 4e avenue Sud',                     'Pierrefonds',                        'H8Y 2M2', null),
    ('Cécile Marquis',                       'marcec19@hotmail.com',                '450-622-0949', '470 rue Saint-Saëns Est',              'Laval',                              'H7H 2V8', null),
    ('Chantal Fortin',                       'chantalfortin73@videotron.ca',        '514-699-9896', '520 rue Martel',                       'Chambly',                            'J3L 0R3', null),
    ('Charles Dalpé',                        'charlesdalpe1055@gmail.com',          null,           '8920 rue Marie-Anne-Fortier',          'Mirabel',                            null,      null),
    ('Christopher Dubois',                   'christopherld@hotmail.ca',            '514-708-4485', '12339 62e avenue',                     'Montréal',                           'H1C 1T9', 'Entreprise : Dubois Groupe Construction'),
    ('Claudette Jodin',                      'jolin.claudette@gmail.com',           '819-219-0249', null,                                    null,                                 null,      null),
    ('Claudette Binette',                    'binleb@videotron.ca',                 '450-582-2061', '54 rue Gaudreault',                    'Repentigny',                         'J6A 1M5', null),
    ('Claudio Ferri',                        'claudio.ferri@videotron.ca',          '514-909-1103', '12220 53e avenue',                     'Montréal',                           'H1E 0A6', null),
    ('Curtis',                               'curtisluc@hotmail.com',               '514-913-1570', '12430 boul. Marien',                   'Montréal',                           'H1C 1L9', null),
    ('Daniel Côté',                          'mhfcdancote@hotmail.com',             '514-705-3097', '42 Gai-Luron',                         'Sainte-Marguerite-du-Lac-Masson',    'J0T 1L0', null),
    ('Daniel Boutin',                        'mithraco@videotron.ca',               '438-490-3479', '242 place Courville',                  'Boisbriand',                         'J7G 1X5', null),
    ('Dany Huneault',                        null,                                  null,           '4815 Ontario Est',                     'Montréal',                           'H1V 3B8', 'Email dans l''ancienne app : peinture.jtl@gmail.com (à corriger)'),
    ('Dany Rella',                           'info@vitrerieumbrella.ca',            null,           '192 rue Îles-Morris',                  'Terrebonne',                         'J6W 6J3', 'Entreprise : Umbrella'),
    ('David',                                'daviddeles97@gmail.com',              '514-915-6735', '514 rue des Hirondelles',              'Saint-Eustache',                     'J7R 0M6', null),
    ('David Lussier',                        'davidlussier1326@icloud.com',         '514-973-1326', '305 rue de Margaux',                   'Mascouche',                          'J6W 0C6', null),
    ('Edmond Volgo',                         'edmondvolgo@gmail.com',               '514-973-7153', '175 chemin Coutu',                     'Saint-Donat',                        'J0T 2C0', null),
    ('Éric Bédard',                          'eric.b@spray-net.com',                '514-627-3703', '132 rue Alizé',                        'Saint-Colomban',                     'J5K 0B2', 'Entreprise : Spray-Net'),
    ('Fatima',                               null,                                  '514-236-0513', '138 rue Alexandre',                    'Rosemère',                           'J7A 4H4', 'Entreprise : Résidence troisième âge'),
    ('Félix & Oli',                          'info@creations54.com',                '514-266-9379', '1884 rue Lepailleur',                  'Montréal',                           'H1L 6E3', 'Entreprise : Création 54 — Tél. secondaire : 514-824-1740'),
    ('Florence Sénécal',                     'syndicat8942@gmail.com',              '438-884-7869', '8942 Lajeunesse',                      'Montréal',                           'H2M 1R9', 'Entreprise : Syndicat Copropriété'),
    ('François Nocil',                       'tmnfconstruction@gmail.com',          null,           '3447 chemin Lotbinière',               'Saint-Lazare',                       'J7T 2N6', null),
    ('François Mathieu',                     'francois.kmathieu@gmail.com',         '514-497-4573', '47 Deslauriers',                       'Pierrefonds',                        'H8Y 2E5', null),
    ('Gestion Emmanuel Laporte',             'admin@nordem.ca',                     '514-258-9234', '10305 boul. Laurier',                  'Terrebonne',                         'J7M 1V4', null),
    ('Gestion LBC',                          'shanlanglois@icloud.com',             null,           null,                                    null,                                 null,      null),
    ('Gus Construction',                     'y.marchand@groupejmc.ca',             '450-541-5050', '470 rue Bourque',                      'Repentigny',                         'J5Z 5A2', null),
    ('Irina',                                'div1981@hotmail.com',                 '514-463-2092', '190 rue Saraguay Est',                 'Roxboro',                            'H8Y 3H5', null),
    ('Isabelle Champagne',                   'ichampagne048@gmail.com',             '450-368-0486', '139 Pierre-Fournier',                  'Lachenaie',                          'J6V 1J6', null),
    ('Isabelle Larouche',                    'ilaroucheavocate@yahoo.ca',           '514-576-5580', '1257 de Cardiff',                      'Laval',                              'H7P 6B4', null),
    ('Ivan',                                 'ivan@gcmrenovation.com',              '514-578-9966', '7455 place Tchad',                     'Brossard',                           'J4W 3C7', 'Entreprise : GCM Rénovation (General Contractor Management)'),
    ('Jacques Kemp',                         'jgauthier@vacapital.ca',              '514-817-1622', '160 King',                             'Montréal',                           'H3C 2P3', null),
    ('Jacques Soufflet',                     'soufflet59@hotmail.com',              '438-630-1332', '370 rue Théoret',                      'Deux-Montagnes',                     'J7P 3W5', null),
    ('Jacynthe',                             'jacinthe_troy@hotmail.com',           '514-771-9394', '18897 Hubert-Aquin',                   'Mirabel',                            null,      null),
    ('James',                                'jamesgaspard@hotmail.com',            null,           '11 rue d''Argenson',                   'Blainville',                         'J7C 4H2', null),
    ('Janie Bélanger',                       'janie.boulanger@videotron.ca',        null,           null,                                    null,                                 null,      null),
    ('Jean-Claude Larouche',                 'jc_larouche@videotron.ca',            '514-512-1683', '3280 rue Carmina',                     'Laval',                              'H7P 4G9', 'Tél. secondaire : 450-625-1682'),
    ('Jean-Pierre Tremblay',                 null,                                  null,           '4500 Oxford',                          'Montréal',                           'H4A 1A8', 'Email dans l''ancienne app : peinture.jtl@gmail.com (à corriger)'),
    ('Jo Dahan',                             'constructionmarisbec@gmail.com',      '514-892-1142', '2800 Ekers',                           'Montréal',                           'H3S 1E3', 'Entreprise : Marisbec Construction'),
    ('John Tee',                             'joh_trottier@hotmail.com',            null,           '206 rue des Hérons',                   'Saint-Eustache',                     'J7R 0E2', null),
    ('Jonathan Supper',                      'admin@untoitsurmatete.ca',            '514-915-5703', '2025 rue des Artisans',                'Saint-Jérôme',                       'J7Y 4S6', 'Entreprise : Un toit sur ma tête'),
    ('Julie Rebecq',                         'julie.rebecq2@gmail.com',             '514-827-4397', '10402 De Lorimier',                    'Montréal',                           'H2B 2J2', null),
    ('July Lavigne',                         'j.lavigne440@gmail.com',              '514-347-3242', '7984 Coursol',                         'Saint-Augustin',                     null,      null),
    ('Karine Groleau',                       'karine-groleau@hotmail.com',          null,           '408 rue Lessard',                      'Lachute',                            'J8H 4L6', null),
    ('Linda Carrier',                        'linda.lesvacanciers@gmail.com',       '514-754-3471', '2584 rue Pluvier',                     'Laval',                              'H7L 4J1', null),
    ('Lovely Alexis',                        'doris@designbyaina.com',              '514-704-0572', '1477 rue McDonald',                    'Montréal',                           'H4L 2A8', null),
    ('Luc Désilets',                         'luc.desilets@gmail.com',              '514-757-8416', '115 rue de la Villa',                  'Rosemère',                           'J5K 1K2', 'Contact personnel'),
    ('Luc Denault',                          'lucdenault@hotmail.com',              '819-790-8559', '160 Matte',                            'Mont-Tremblant',                     'J8E 1P3', null),
    ('Luc Désilets (bureau de comté)',       'luc.desilet@parl.gc.ca',              '514-815-2012', '45 rue Grignon',                       'Saint-Eustache',                     'J7P 4X1', 'Député de Rivière-des-Mille-Îles — 2e contact : arianne_collin@hotmail.com'),
    ('Manon Van Vloodorp',                   'manonvan@msn.com',                    null,           '414-B rue Saint-Eustache',             'Saint-Eustache',                     'J7R 2M3', null),
    ('Manuel Bornand',                       'manuel45_45@hotmail.com',             null,           null,                                    null,                                 null,      null),
    ('Marie-Chantal Hirigoyen',              'famillehirigoyen@videotron.ca',       '514-464-9164', '2644 de l''Ombrette',                  'Laval',                              'H7L 3Z5', null),
    ('Marie-France Nantel',                  'marief.nantel@gmail.com',             null,           '34 Pointe-des-Prêtres',                'Saint-Donat',                        'J0T 2C0', null),
    ('Marie-Andrée Trudeau',                 null,                                  null,           '2011 de la Montagne',                  'Montréal',                           'H3J 1B8', 'Email dans l''ancienne app : peinture.jtl@gmail.com (à corriger)'),
    ('Marie-Claude Potvin',                  'mcpotvin@hotmail.com',                '514-835-1823', '58 rue Boréal',                        'Sainte-Marguerite-du-Lac-Masson',    'J0T 1L0', null),
    ('Mario Lecompte',                       'johanne.lefebvre1950@gmail.com',      '450-412-0505', '298 rue du Havre',                     'Saint-Colomban',                     'J5K 2V2', null),
    ('Martine Dubé',                         null,                                  null,           '1880 boul. Rosemont',                  'Montréal',                           'H2G 1S6', 'Email dans l''ancienne app : peinture.jtl@gmail.com (à corriger)'),
    ('Mathieu Paré',                         'mp@bomattconstruction.ca',            '514-247-0870', '110 rue des Bécasseaux',               'Saint-Colomban',                     'J5K 1A2', 'Entreprise : Bomatt'),
    ('Michel Poudrier',                      'michelpoudrier2325@gmail.com',        '450-918-4385', '2325 rue Versailles',                  'Mascouche',                          'J7K 0L3', null),
    ('Nancy Christin',                       'nancy_christin09@icloud.com',         '514-898-3660', '2900 chemin Oka',                      'Sainte-Marthe-sur-le-Lac',           'J0N 1P0', null),
    ('Nancy Legault',                        'nan.inf@hotmail.com',                 '514-239-3392', '4410 rue des Francs-Bourgeois',        'Boisbriand',                         'J7H 1M9', null),
    ('Noémie Girard',                        'dounegirard@gmail.com',               '514-793-1478', '444 rue Jérémie',                      'Lachute',                            'J8H 4P4', null),
    ('Olivier Renière',                      'olivier.reniere@gmail.com',           null,           '1293 Salaberry',                       'Chambly',                            'J3L 1R8', null),
    ('Ovidiu Poienaru',                      'ovi@creations54.com',                 '514-824-1740', '85 avenue Henley',                     'Montréal',                           'H3P 1V5', 'Entreprise : Créations 54'),
    ('Pascale Nicholas',                     'selena.roche@hotmail.com',            '514-835-2421', '42 rue Hector-Joly',                   'Blainville',                         'J7C 0E3', null),
    ('Patrice Carle',                        null,                                  null,           '817 rue Desnoyers',                    'Montréal',                           'H4C 3E1', 'Email dans l''ancienne app : peinture.jtl@gmail.com (à corriger)'),
    ('Patrice Reid',                         'patricereid1@yahoo.ca',               '514-606-0812', '1153 boul. Céloron',                   'Blainville',                         'J7C 4Y8', null),
    ('Patricia Brissette',                   'bripat73@gmail.com',                  '514-386-5031', '40 rue Pistole',                       'Blainville',                         'J7C 5X4', null),
    ('Philippe Sasseville',                  'philippesasseville12@gmail.com',      '514-850-9755', '419 rue Rochon',                       'Saint-Jérôme',                       'J7Y 3Z7', null),
    ('Pierre Michel',                        null,                                  null,           '376 Kindersley Avenue',                'Montréal',                           'H3R 1R9', 'Email dans l''ancienne app : peinture.jtl@gmail.com (à corriger)'),
    ('Raymond Sénécal',                      'raymondsenecal0@gmail.com',           '514-991-7869', '152 rue Gravel',                       'Saint-Eustache',                     'J7P 3S3', null),
    ('Richard Comtois',                      'richardcomtois56@outlook.com',        '514-264-9107', null,                                    null,                                 null,      null),
    ('Richard Brunet',                       'francinelevesque62@videotron.ca',     '514-834-2884', '6640 Émile-Augier',                    'Laval',                              'H7R 6B3', null),
    ('Ron Dicapua',                          'autoedr@gmail.com',                   null,           '6024 boul. Couture',                   'Montréal',                           'H1P 1A9', null),
    ('Sabrina Sauvé',                        'sabrina@cliniqueentre-nous.ca',       '450-596-6883', '200 rue Durand',                       'Saint-Jérôme',                       'J7Z 5P8', 'Entreprise : Clinique Entre-Nous'),
    ('Sonia Mercier',                        'sonia.mercier@laturquoise.ca',        '514-349-1184', '121 rue Bates',                        'Montréal',                           'H2V 1B1', null),
    ('Stéphanie Champagne',                  'stephanie-champagne@hotmail.com',     '514-622-6223', '205 chemin Hammond',                   'Morin-Heights',                      'J0R 1A0', null),
    ('Stéphanie Robert',                     'verdun66@hotmail.com',                '514-222-8413', '206 rue des Hérons',                   'Saint-Eustache',                     'J7R 0K1', null),
    ('Stéphanie Fournier',                   'stephanie.fournier@hotmail.com',      '514-588-7083', '1031 local 4, Gilles-Vigneault',       'Blainville',                         'J7C 5N5', null),
    ('Sylvain Théberge',                     'thebergesylvain@live.fr',             '514-519-8095', '883 rue des Giroflées',                'Laval',                              'H7X 3G5', null),
    ('Weijie Fan',                           'weij.fan@gmail.com',                  '438-527-4868', '21 croissant Cedar',                   'Beaconsfield',                       'H9W 4S9', 'Entreprise : GJC Construction')
  ) as t(nom, email, telephone, adresse, ville, code_postal, notes)
  where not exists (
    select 1 from public.clients c
    where c.company_id = v_company_id
      and lower(c.nom) = lower(t.nom)
  );

  get diagnostics v_inserted = row_count;
  raise notice 'Import Peinture JTL : % clients insérés (compagnie %)', v_inserted, v_company_id;
end $$;
