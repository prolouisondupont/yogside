-- Rappel 24 h avant : on note l'envoi pour ne jamais l'envoyer deux fois,
-- même si la tâche quotidienne est relancée.
alter table public.reservations add column rappel_envoye_le timestamptz;
