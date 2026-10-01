-- Vérifier « déjà inscrit » avant « complet » : une élève déjà inscrite à une
-- séance pleine doit être informée qu'elle a déjà sa place.

create or replace function public.reserver(
  p_seance_id   uuid,
  p_workshop_id uuid,
  p_prenom      text,
  p_nom         text,
  p_email       text,
  p_telephone   text,
  p_pret_tapis  boolean default false,
  p_message     text default null
)
returns table (reservation_id uuid, jeton uuid, inscrits integer, capacite integer)
language plpgsql
security definer
set search_path = ''
as $$
-- Les colonnes de retour (jeton, capacite…) portent les mêmes noms que des
-- colonnes de table : en cas d'ambiguïté, c'est la colonne qui l'emporte.
#variable_conflict use_column
declare
  v_email    text := lower(trim(p_email));
  v_capacite integer;
  v_annulee  boolean;
  v_debut    timestamptz;
  v_inscrits integer;
  v_id       uuid;
  v_jeton    uuid;
begin
  if num_nonnulls(p_seance_id, p_workshop_id) <> 1 then
    raise exception 'cible_invalide';
  end if;

  if coalesce(trim(p_prenom), '') = '' or coalesce(trim(p_nom), '') = ''
     or coalesce(trim(p_telephone), '') = ''
     or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'donnees_invalides';
  end if;

  -- Verrou sur la ligne : deux réservations simultanées sur la même séance
  -- s'exécutent l'une après l'autre, la seconde voit le compte à jour.
  if p_seance_id is not null then
    select s.capacite, s.annulee, public.instant_paris(s.date, c.heure_debut)
      into v_capacite, v_annulee, v_debut
      from public.seances s
      join public.cours c on c.id = s.cours_id
     where s.id = p_seance_id
       for update of s;
  else
    select w.capacite, (w.annule or not w.publie), public.instant_paris(w.date, w.heure_debut)
      into v_capacite, v_annulee, v_debut
      from public.workshops w
     where w.id = p_workshop_id
       for update;
  end if;

  if not found then
    raise exception 'introuvable';
  end if;
  if v_annulee then
    raise exception 'annulee';
  end if;
  if v_debut <= now() then
    raise exception 'commencee';
  end if;

  select count(*)::integer into v_inscrits
    from public.reservations r
   where r.statut = 'confirmee'
     and (r.seance_id = p_seance_id or r.workshop_id = p_workshop_id);

  if exists (
    select 1 from public.reservations r
     where r.statut = 'confirmee' and r.email = v_email
       and (r.seance_id = p_seance_id or r.workshop_id = p_workshop_id)
  ) then
    raise exception 'deja_inscrit';
  end if;

  if v_inscrits >= v_capacite then
    raise exception 'complet';
  end if;

  insert into public.reservations
    (seance_id, workshop_id, prenom, nom, email, telephone, pret_tapis, message)
  values
    (p_seance_id, p_workshop_id, trim(p_prenom), trim(p_nom), v_email,
     trim(p_telephone), coalesce(p_pret_tapis, false), nullif(trim(p_message), ''))
  returning id, reservations.jeton into v_id, v_jeton;

  return query select v_id, v_jeton, v_inscrits + 1, v_capacite;
end;
$$;
