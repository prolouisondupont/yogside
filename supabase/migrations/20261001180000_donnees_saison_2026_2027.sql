-- =============================================================================
-- Données réelles — saison 2026-2027
-- Source : yogside.com, page « Les cours » (version desktop, mise à jour le
-- 09/09/2026) et page « Événement ». Les créneaux ne changent pas avant août 2027.
-- =============================================================================

-- Lieux
-- Colette Gym et Inspire : liens Google Maps du site actuel.
-- La Fabrique des Possibles : son site officiel.
-- Le Yoga de Priti et Work'in Tours : annuaires en ligne, à faire confirmer.
insert into public.lieux (id, nom, adresse, code_postal, ville) values
  ('0b1d6a3e-0001-4000-8000-000000000001', 'Colette Gym',               '54 rue Sébastopol',       '37000', 'Tours'),
  ('0b1d6a3e-0001-4000-8000-000000000002', 'Le Yoga de Priti',          '52 rue Colbert',          '37000', 'Tours'),
  ('0b1d6a3e-0001-4000-8000-000000000003', 'Work''in Tours',            '26 rue de la Préfecture', '37000', 'Tours'),
  ('0b1d6a3e-0001-4000-8000-000000000004', 'Inspire',                   '8 boulevard Richard Wagner', '37000', 'Tours'),
  ('0b1d6a3e-0001-4000-8000-000000000005', 'La Fabrique des Possibles', '14 rue Joseph Bara',      '37000', 'Tours');

-- Cours hebdomadaires
do $$
declare
  v_hatha   text := 'Une classe traditionnelle dans l’observance des alignements et de la circulation de l’énergie dans la posture. Une pratique stimulante et apaisante, reliant corps et esprit.';
  v_vinyasa text := 'Une pratique intense invitant au lâcher-prise. Les poses s’enchaînent de façon dynamique afin de réveiller Agni (le feu). Détoxifiante, entraînante et énergisante, le vinyasa permet de trouver la fluidité entre mouvement et respiration tout en restant connecté au ressenti.';
  v_colette uuid := '0b1d6a3e-0001-4000-8000-000000000001';
  v_priti   uuid := '0b1d6a3e-0001-4000-8000-000000000002';
  v_workin  uuid := '0b1d6a3e-0001-4000-8000-000000000003';
begin
  insert into public.cours
    (nom, description, lieu_id, jour_semaine, heure_debut, heure_fin, saison_debut, saison_fin)
  values
    ('Hatha flow', v_hatha,   v_colette, 1, '19:00', '20:15', '2026-09-07', '2027-07-31'),
    ('Hatha flow', v_hatha,   v_colette, 3, '20:15', '21:30', '2026-09-07', '2027-07-31'),
    ('Hatha flow', v_hatha,   v_colette, 4, '08:45', '10:00', '2026-09-07', '2027-07-31'),
    ('Vinyasa',    v_vinyasa, v_priti,   3, '10:30', '11:45', '2026-09-07', '2027-07-31'),
    ('Vinyasa',    v_vinyasa, v_colette, 5, '18:30', '19:45', '2026-09-07', '2027-07-31'),
    ('Vinyasa',    v_vinyasa, v_workin,  6, '11:15', '12:30', '2026-09-07', '2027-07-31');
end;
$$;

-- Workshops à venir (les dates de septembre 2026 sont passées)
do $$
declare
  v_fabrique uuid := '0b1d6a3e-0001-4000-8000-000000000005';
  -- Textes repris du site actuel, sans ajout
  v_yin      text := 'Yin et bain sonore, les samedis à la Fabrique des Possibles avec Grégory.';
  v_workshop text := 'Des classes mensuelles de 2h30 orientées autour d’une thématique précise. La durée des cours nous permet d’aller plus loin dans l’exploration du souffle, des postures et de la méditation.';
begin
  insert into public.workshops
    (titre, description, lieu_id, date, heure_debut, heure_fin, tarif, publie)
  values
    ('Yin & bain sonore', v_yin, v_fabrique, '2026-11-07', '17:30', '19:30', 35, true),
    ('Yin & bain sonore', v_yin, v_fabrique, '2027-01-16', '17:00', '19:00', 35, true),
    ('Yin & bain sonore', v_yin, v_fabrique, '2027-03-13', '17:00', '19:00', 35, true),
    ('Yin & bain sonore', v_yin, v_fabrique, '2027-05-15', '17:00', '19:00', 35, true),
    ('Workshop yoga', v_workshop, v_fabrique, '2026-10-25', '09:30', '12:00', 40, true),
    ('Workshop yoga', v_workshop, v_fabrique, '2026-11-22', '09:30', '12:00', 40, true),
    ('Workshop yoga', v_workshop, v_fabrique, '2026-12-20', '09:30', '12:00', 40, true),
    ('Workshop yoga', v_workshop, v_fabrique, '2027-01-24', '09:30', '12:00', 40, true),
    ('Workshop yoga', v_workshop, v_fabrique, '2027-02-21', '09:30', '12:00', 40, true),
    ('Workshop yoga', v_workshop, v_fabrique, '2027-03-21', '09:30', '12:00', 40, true),
    ('Workshop yoga', v_workshop, v_fabrique, '2027-04-18', '09:30', '12:00', 40, true),
    ('Workshop yoga', v_workshop, v_fabrique, '2027-05-23', '09:30', '12:00', 40, true);
end;
$$;

-- Première génération des séances (8 semaines). La tâche quotidienne prendra
-- le relais à l'étape 4.
select public.generer_seances();
