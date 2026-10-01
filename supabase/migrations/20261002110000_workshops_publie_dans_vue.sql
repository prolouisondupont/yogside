-- L'espace de gestion affiche les workshops en brouillon : on expose « publie ».
-- (Le public ne voit de toute façon que les workshops publiés, via le RLS.)
create or replace view public.workshops_disponibilite
with (security_invoker = true)
as
select
  w.id,
  w.titre,
  w.description,
  w.lieu_id,
  w.date,
  w.heure_debut,
  w.heure_fin,
  public.instant_paris(w.date, w.heure_debut) as debut,
  w.tarif,
  w.capacite,
  w.annule,
  w.motif_annulation,
  i.inscrits,
  greatest(w.capacite - i.inscrits, 0) as places_restantes,
  (w.publie
    and not w.annule
    and public.instant_paris(w.date, w.heure_debut) > now()
    and i.inscrits < w.capacite) as reservable,
  w.publie
from public.workshops w
cross join lateral (select public.nb_inscrits_workshop(w.id) as inscrits) i;
