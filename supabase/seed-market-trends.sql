-- Nettoyage des anciennes données de marché si existantes
truncate table public.market_trends;

-- 1. Matériaux de Construction Généraux
insert into public.market_trends (date_ref, indicateur, valeur, unite, categorie, region) values
-- Bois de charpente (prix au m³ en CAD)
('2025-07-01', 'Bois de charpente', 380.00, '$/m³', 'matériaux', 'Québec'),
('2025-09-01', 'Bois de charpente', 395.00, '$/m³', 'matériaux', 'Québec'),
('2025-11-01', 'Bois de charpente', 410.00, '$/m³', 'matériaux', 'Québec'),
('2026-01-01', 'Bois de charpente', 430.00, '$/m³', 'matériaux', 'Québec'),
('2026-03-01', 'Bois de charpente', 445.00, '$/m³', 'matériaux', 'Québec'),
('2026-05-01', 'Bois de charpente', 465.00, '$/m³', 'matériaux', 'Québec'),
('2026-07-01', 'Bois de charpente', 480.00, '$/m³', 'matériaux', 'Québec'),

-- Béton prêt-à-l'emploi (prix au m³ en CAD)
('2025-07-01', 'Béton prêt-à-l''emploi', 145.00, '$/m³', 'matériaux', 'Québec'),
('2025-09-01', 'Béton prêt-à-l''emploi', 148.00, '$/m³', 'matériaux', 'Québec'),
('2025-11-01', 'Béton prêt-à-l''emploi', 152.00, '$/m³', 'matériaux', 'Québec'),
('2026-01-01', 'Béton prêt-à-l''emploi', 155.00, '$/m³', 'matériaux', 'Québec'),
('2026-03-01', 'Béton prêt-à-l''emploi', 158.00, '$/m³', 'matériaux', 'Québec'),
('2026-05-01', 'Béton prêt-à-l''emploi', 162.00, '$/m³', 'matériaux', 'Québec'),
('2026-07-01', 'Béton prêt-à-l''emploi', 165.00, '$/m³', 'matériaux', 'Québec');

-- 2. Spécifique Peinture (Matériaux Peinture)
insert into public.market_trends (date_ref, indicateur, valeur, unite, categorie, region) values
-- Peinture latex haut de gamme (prix au gallon de 3.78L)
('2025-07-01', 'Peinture latex', 68.00, '$/gal', 'matériaux', 'Québec'),
('2025-09-01', 'Peinture latex', 70.00, '$/gal', 'matériaux', 'Québec'),
('2025-11-01', 'Peinture latex', 71.50, '$/gal', 'matériaux', 'Québec'),
('2026-01-01', 'Peinture latex', 73.00, '$/gal', 'matériaux', 'Québec'),
('2026-03-01', 'Peinture latex', 74.50, '$/gal', 'matériaux', 'Québec'),
('2026-05-01', 'Peinture latex', 76.50, '$/gal', 'matériaux', 'Québec'),
('2026-07-01', 'Peinture latex', 78.00, '$/gal', 'matériaux', 'Québec'),

-- Revêtement époxy commercial (prix au kit de 10L)
('2025-07-01', 'Revêtement époxy', 210.00, '$/kit', 'matériaux', 'Québec'),
('2025-09-01', 'Revêtement époxy', 215.00, '$/kit', 'matériaux', 'Québec'),
('2025-11-01', 'Revêtement époxy', 222.00, '$/kit', 'matériaux', 'Québec'),
('2026-01-01', 'Revêtement époxy', 225.00, '$/kit', 'matériaux', 'Québec'),
('2026-03-01', 'Revêtement époxy', 230.00, '$/kit', 'matériaux', 'Québec'),
('2026-05-01', 'Revêtement époxy', 238.00, '$/kit', 'matériaux', 'Québec'),
('2026-07-01', 'Revêtement époxy', 245.00, '$/kit', 'matériaux', 'Québec'),

-- Apprêt scellant acrylique (prix au gallon)
('2025-07-01', 'Apprêt scellant', 42.00, '$/gal', 'matériaux', 'Québec'),
('2025-09-01', 'Apprêt scellant', 43.50, '$/gal', 'matériaux', 'Québec'),
('2025-11-01', 'Apprêt scellant', 44.00, '$/gal', 'matériaux', 'Québec'),
('2026-01-01', 'Apprêt scellant', 45.50, '$/gal', 'matériaux', 'Québec'),
('2026-03-01', 'Apprêt scellant', 47.00, '$/gal', 'matériaux', 'Québec'),
('2026-05-01', 'Apprêt scellant', 48.00, '$/gal', 'matériaux', 'Québec'),
('2026-07-01', 'Apprêt scellant', 49.50, '$/gal', 'matériaux', 'Québec');

-- 3. Logement : Mises en chantier résidentielles par région (2026Q1 / 2026Q2)
insert into public.market_trends (date_ref, indicateur, valeur, unite, categorie, region) values
('2026-03-31', 'Mises en chantier', 3450, 'unités', 'logement', 'Montréal'),
('2026-06-30', 'Mises en chantier', 3820, 'unités', 'logement', 'Montréal'),

('2026-03-31', 'Mises en chantier', 1250, 'unités', 'logement', 'Laurentides'),
('2026-06-30', 'Mises en chantier', 1480, 'unités', 'logement', 'Laurentides'),

('2026-03-31', 'Mises en chantier', 1950, 'unités', 'logement', 'Montérégie'),
('2026-06-30', 'Mises en chantier', 2150, 'unités', 'logement', 'Montérégie');

-- 4. Taux et Salaires (Taux Banque du Canada)
insert into public.market_trends (date_ref, indicateur, valeur, unite, categorie, region) values
('2026-07-15', 'Taux directeur', 2.25, '%', 'taux', 'Canada'),
('2026-07-15', 'Taux hypothécaire fixe 5 ans', 3.95, '%', 'taux', 'Canada');
