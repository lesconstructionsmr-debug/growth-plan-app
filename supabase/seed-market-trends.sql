-- Nettoyage des anciennes données de marché si existantes
truncate table public.market_trends;

-- 1. Matériaux : Indices de coûts (Série mensuelle de juillet 2025 à juillet 2026)
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
('2026-07-01', 'Béton prêt-à-l''emploi', 165.00, '$/m³', 'matériaux', 'Québec'),

-- Acier de structure (prix par tonne en CAD)
('2025-07-01', 'Acier de structure', 1850.00, '$/tonne', 'matériaux', 'Québec'),
('2025-09-01', 'Acier de structure', 1880.00, '$/tonne', 'matériaux', 'Québec'),
('2025-11-01', 'Acier de structure', 1920.00, '$/tonne', 'matériaux', 'Québec'),
('2026-01-01', 'Acier de structure', 1950.00, '$/tonne', 'matériaux', 'Québec'),
('2026-03-01', 'Acier de structure', 1990.00, '$/tonne', 'matériaux', 'Québec'),
('2026-05-01', 'Acier de structure', 2050.00, '$/tonne', 'matériaux', 'Québec'),
('2026-07-01', 'Acier de structure', 2100.00, '$/tonne', 'matériaux', 'Québec');

-- 2. Logement : Mises en chantier résidentielles par région (2026Q1 / 2026Q2)
insert into public.market_trends (date_ref, indicateur, valeur, unite, categorie, region) values
('2026-03-31', 'Mises en chantier', 3450, 'unités', 'logement', 'Montréal'),
('2026-06-30', 'Mises en chantier', 3820, 'unités', 'logement', 'Montréal'),

('2026-03-31', 'Mises en chantier', 1250, 'unités', 'logement', 'Laurentides'),
('2026-06-30', 'Mises en chantier', 1480, 'unités', 'logement', 'Laurentides'),

('2026-03-31', 'Mises en chantier', 1950, 'unités', 'logement', 'Montérégie'),
('2026-06-30', 'Mises en chantier', 2150, 'unités', 'logement', 'Montérégie');

-- 3. Taux : Taux d'intérêts et indicateurs financiers (Juillet 2026)
insert into public.market_trends (date_ref, indicateur, valeur, unite, categorie, region) values
('2026-07-01', 'Taux directeur', 4.50, '%', 'taux', 'Canada'),
('2026-07-01', 'Taux hypothécaire fixe 5 ans', 5.24, '%', 'taux', 'Canada');
