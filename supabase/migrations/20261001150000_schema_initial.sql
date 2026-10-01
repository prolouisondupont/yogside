-- =============================================================================
-- Yogside — schéma initial
-- Tables, contraintes, vues de disponibilité, fonctions métier et RLS.
-- Référence : docs/specs.md
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------

create type public.statut_reservation as enum ('confirmee', 'annulee');


-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.lieux (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  adresse     text not null,
  code_postal text not null,
  ville       text not null default 'Tours',
  -- Permet de retirer un lieu sans perdre l'historique
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Créneaux récurrents. Jamais modifiés une fois leurs séances générées :
-- une nouvelle saison = de nouvelles lignes.
create table public.cours (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  description  text,
  lieu_id      uuid not null references public.lieux (id) on delete restrict,
  -- 1 = lundi … 7 = dimanche (norme ISO, comme extract(isodow))
  jour_semaine smallint not null check (jour_semaine between 1 and 7),
  heure_debut  time not null,
  heure_fin    time not null,
  capacite     integer not null default 12 check (capacite > 0),
  saison_debut date not null,
  saison_fin   date not null,
  actif        boolean not null default true,
  created_at   timestamptz not null default now(),
  check (heure_fin > heure_debut),
  check (saison_fin >= saison_debut)
);

-- Occurrences réelles des cours, générées à l'avance par generer_seances().
create table public.seances (
  id               uuid primary key default gen_random_uuid(),
  cours_id         uuid not null references public.cours (id) on delete restrict,
  date             date not null,
  -- Recopiée du cours à la génération, modifiable au cas par cas
  capacite         integer not null check (capacite > 0),
  annulee          boolean not null default false,
  motif_annulation text,
  annulee_le       timestamptz,
  created_at       timestamptz not null default now(),
  -- Permet de relancer la génération sans créer de doublons
  unique (cours_id, date)
);

create index seances_date_idx on public.seances (date);

-- Absences de la professeure : aucune séance générée sur ces dates.
create table public.periodes_off (
  id         uuid primary key default gen_random_uuid(),
  date_debut date not null,
  date_fin   date not null,
  motif      text,
  created_at timestamptz not null default now(),
  check (date_fin >= date_debut)
);

create table public.workshops (
  id               uuid primary key default gen_random_uuid(),
  titre            text not null,
  description      text,
  lieu_id          uuid not null references public.lieux (id) on delete restrict,
  date             date not null,
  heure_debut      time not null,
  heure_fin        time not null,
  capacite         integer not null default 12 check (capacite > 0),
  -- Affiché seulement, aucun encaissement
  tarif            numeric(6, 2) check (tarif >= 0),
  publie           boolean not null default false,
  annule           boolean not null default false,
  motif_annulation text,
  annule_le        timestamptz,
  created_at       timestamptz not null default now(),
  check (heure_fin > heure_debut)
);

create index workshops_date_idx on public.workshops (date);

create table public.reservations (
  id            uuid primary key default gen_random_uuid(),
  seance_id     uuid references public.seances (id) on delete restrict,
  workshop_id   uuid references public.workshops (id) on delete restrict,
  -- Nullables uniquement pour l'anonymisation à la suppression d'un compte
  prenom        text,
  nom           text,
  -- Toujours en minuscules : sert à rattacher la réservation au compte élève
  email         text check (email = lower(email)),
  telephone     text,
  pret_tapis    boolean not null default false,
  message       text,
  statut        public.statut_reservation not null default 'confirmee',
  -- Lien d'annulation envoyé par mail
  jeton         uuid not null unique default gen_random_uuid(),
  annulee_le    timestamptz,
  anonymisee_le timestamptz,
  created_at    timestamptz not null default now(),
  -- Exactement une séance OU un workshop
  check (num_nonnulls(seance_id, workshop_id) = 1),
  check (anonymisee_le is not null or (prenom is not null and nom is not null and email is not null))
);

-- Pas de double inscription, mais réinscription possible après annulation
create unique index reservations_seance_email_uidx
  on public.reservations (seance_id, email) where statut = 'confirmee' and seance_id is not null;
create unique index reservations_workshop_email_uidx
  on public.reservations (workshop_id, email) where statut = 'confirmee' and workshop_id is not null;
create index reservations_email_idx on public.reservations (email);

-- Comptes élèves (optionnels). L'email est celui de auth.users.
create table public.profils (
  id         uuid primary key references auth.users (id) on delete cascade,
  prenom     text,
  nom        text,
  telephone  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rôle administratrice. Alimentée à la main, aucune écriture possible via l'API.
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- Fonctions utilitaires
-- -----------------------------------------------------------------------------

create function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Date et heure locales (Paris) converties en instant absolu
create function public.instant_paris(p_date date, p_heure time)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select (p_date + p_heure) at time zone 'Europe/Paris';
$$;

-- Aujourd'hui, à Paris (current_date est en UTC sur Supabase)
create function public.aujourdhui_paris()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Paris')::date;
$$;

-- Comptages exposés au public : seuls des chiffres sortent, jamais de données
-- personnelles. security definer car le public n'a aucun accès à reservations.
create function public.nb_inscrits_seance(p_seance_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.reservations
  where seance_id = p_seance_id and statut = 'confirmee';
$$;

create function public.nb_inscrits_workshop(p_workshop_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.reservations
  where workshop_id = p_workshop_id and statut = 'confirmee';
$$;


-- -----------------------------------------------------------------------------
-- Vues de disponibilité (jauges)
-- security_invoker : la vue respecte le RLS de l'utilisateur qui l'interroge.
-- -----------------------------------------------------------------------------

create view public.seances_disponibilite
with (security_invoker = true)
as
select
  s.id,
  s.cours_id,
  c.nom,
  c.lieu_id,
  s.date,
  c.heure_debut,
  c.heure_fin,
  public.instant_paris(s.date, c.heure_debut) as debut,
  s.capacite,
  s.annulee,
  s.motif_annulation,
  i.inscrits,
  greatest(s.capacite - i.inscrits, 0) as places_restantes,
  (not s.annulee
    and public.instant_paris(s.date, c.heure_debut) > now()
    and i.inscrits < s.capacite) as reservable
from public.seances s
join public.cours c on c.id = s.cours_id
cross join lateral (select public.nb_inscrits_seance(s.id) as inscrits) i;

create view public.workshops_disponibilite
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
    and i.inscrits < w.capacite) as reservable
from public.workshops w
cross join lateral (select public.nb_inscrits_workshop(w.id) as inscrits) i;


-- -----------------------------------------------------------------------------
-- Réservation transactionnelle
-- Appelée uniquement depuis une route serveur Astro (clé de service).
-- Erreurs levées avec un code court en message, traduit côté front :
--   cible_invalide, introuvable, annulee, commencee, complet, deja_inscrit,
--   donnees_invalides
-- -----------------------------------------------------------------------------

create function public.reserver(
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

  if v_inscrits >= v_capacite then
    raise exception 'complet';
  end if;

  if exists (
    select 1 from public.reservations r
     where r.statut = 'confirmee' and r.email = v_email
       and (r.seance_id = p_seance_id or r.workshop_id = p_workshop_id)
  ) then
    raise exception 'deja_inscrit';
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


-- -----------------------------------------------------------------------------
-- Annulations par l'élève
-- -----------------------------------------------------------------------------

-- Via le lien du mail (route serveur, clé de service). Idempotente.
create function public.annuler_par_jeton(p_jeton uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.reservations
     set statut = 'annulee', annulee_le = coalesce(annulee_le, now())
   where jeton = p_jeton
  returning id into v_id;

  if v_id is null then
    raise exception 'introuvable';
  end if;
  return v_id;
end;
$$;

-- Depuis l'espace élève : uniquement ses propres réservations (même email).
create function public.annuler_ma_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.reservations
     set statut = 'annulee', annulee_le = coalesce(annulee_le, now())
   where id = p_reservation_id
     and email = lower(auth.jwt() ->> 'email');

  if not found then
    raise exception 'introuvable';
  end if;
end;
$$;


-- -----------------------------------------------------------------------------
-- Gestion (professeure)
-- Les fonctions renvoient les réservations touchées, pour envoyer les mails.
-- -----------------------------------------------------------------------------

create function public.annuler_seance(p_seance_id uuid, p_motif text)
returns setof public.reservations
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'acces_refuse';
  end if;

  update public.seances
     set annulee = true, motif_annulation = p_motif, annulee_le = now()
   where id = p_seance_id and not annulee;

  return query
    select * from public.reservations
     where seance_id = p_seance_id and statut = 'confirmee';
end;
$$;

create function public.annuler_workshop(p_workshop_id uuid, p_motif text)
returns setof public.reservations
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'acces_refuse';
  end if;

  update public.workshops
     set annule = true, motif_annulation = p_motif, annule_le = now()
   where id = p_workshop_id and not annule;

  return query
    select * from public.reservations
     where workshop_id = p_workshop_id and statut = 'confirmee';
end;
$$;

-- Déclare une absence et annule les séances déjà générées sur la période.
create function public.creer_periode_off(p_date_debut date, p_date_fin date, p_motif text)
returns setof public.reservations
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'acces_refuse';
  end if;

  insert into public.periodes_off (date_debut, date_fin, motif)
  values (p_date_debut, p_date_fin, p_motif);

  return query
    with annulees as (
      update public.seances
         set annulee = true, motif_annulation = p_motif, annulee_le = now()
       where date between p_date_debut and p_date_fin and not annulee
      returning id
    )
    select r.* from public.reservations r
      join annulees a on a.id = r.seance_id
     where r.statut = 'confirmee';
end;
$$;


-- -----------------------------------------------------------------------------
-- Génération des séances (tâche planifiée quotidienne)
-- Crée les séances des 8 prochaines semaines, en sautant les périodes off.
-- -----------------------------------------------------------------------------

create function public.generer_seances(p_jusqu_au date default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_debut date := public.aujourdhui_paris();
  v_fin   date := coalesce(p_jusqu_au, public.aujourdhui_paris() + 56);
  v_nb    integer;
begin
  insert into public.seances (cours_id, date, capacite)
  select c.id, d::date, c.capacite
    from public.cours c
   cross join generate_series(
           greatest(c.saison_debut, v_debut)::timestamp,
           least(c.saison_fin, v_fin)::timestamp,
           interval '1 day') as d
   where c.actif
     and extract(isodow from d) = c.jour_semaine
     and not exists (
       select 1 from public.periodes_off p
        where d::date between p.date_debut and p.date_fin
     )
  on conflict (cours_id, date) do nothing;

  get diagnostics v_nb = row_count;
  return v_nb;
end;
$$;


-- -----------------------------------------------------------------------------
-- Comptes élèves
-- -----------------------------------------------------------------------------

-- Crée le profil à la première connexion par lien magique
create function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profils (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger a_la_creation_utilisateur
  after insert on auth.users
  for each row execute function public.creer_profil();

create function public.maj_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profils_updated_at
  before update on public.profils
  for each row execute function public.maj_updated_at();

-- Suppression de compte (route serveur, clé de service) : annule les
-- réservations à venir, anonymise toutes celles de cet email. La route
-- supprime ensuite l'utilisateur Auth, ce qui supprime le profil en cascade.
create function public.anonymiser_reservations(p_email text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nb integer;
begin
  update public.reservations r
     set statut = 'annulee', annulee_le = coalesce(r.annulee_le, now())
   where r.email = lower(p_email)
     and r.statut = 'confirmee'
     and (
       exists (select 1 from public.seances s join public.cours c on c.id = s.cours_id
                where s.id = r.seance_id
                  and public.instant_paris(s.date, c.heure_debut) > now())
       or exists (select 1 from public.workshops w
                   where w.id = r.workshop_id
                     and public.instant_paris(w.date, w.heure_debut) > now())
     );

  update public.reservations
     set prenom = null, nom = null, email = null, telephone = null,
         message = null, anonymisee_le = now()
   where email = lower(p_email);

  get diagnostics v_nb = row_count;
  return v_nb;
end;
$$;


-- -----------------------------------------------------------------------------
-- Droits d'exécution des fonctions
-- Par défaut, Supabase les ouvre à anon et authenticated : on referme tout,
-- puis on rouvre au cas par cas.
-- -----------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

-- Utilisées par les politiques RLS et les vues publiques
grant execute on function public.est_admin()                   to anon, authenticated;
grant execute on function public.instant_paris(date, time)     to anon, authenticated;
grant execute on function public.aujourdhui_paris()            to anon, authenticated;
grant execute on function public.nb_inscrits_seance(uuid)      to anon, authenticated;
grant execute on function public.nb_inscrits_workshop(uuid)    to anon, authenticated;

-- Espace élève
grant execute on function public.annuler_ma_reservation(uuid)  to authenticated;

-- Espace de gestion (vérifient est_admin() en interne)
grant execute on function public.annuler_seance(uuid, text)               to authenticated;
grant execute on function public.annuler_workshop(uuid, text)             to authenticated;
grant execute on function public.creer_periode_off(date, date, text)      to authenticated;

-- reserver, annuler_par_jeton, generer_seances, anonymiser_reservations :
-- réservées à la clé de service (routes serveur Astro et tâches planifiées).


-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.lieux         enable row level security;
alter table public.cours         enable row level security;
alter table public.seances       enable row level security;
alter table public.periodes_off  enable row level security;
alter table public.workshops     enable row level security;
alter table public.reservations  enable row level security;
alter table public.profils       enable row level security;
alter table public.admins        enable row level security;

-- Lieux, cours, séances : lecture publique, écriture réservée à la gestion
create policy "lecture publique des lieux" on public.lieux
  for select using (true);
create policy "gestion des lieux" on public.lieux
  for all to authenticated using (public.est_admin()) with check (public.est_admin());

create policy "lecture publique des cours" on public.cours
  for select using (true);
create policy "gestion des cours" on public.cours
  for all to authenticated using (public.est_admin()) with check (public.est_admin());

create policy "lecture publique des séances" on public.seances
  for select using (true);
create policy "gestion des séances" on public.seances
  for all to authenticated using (public.est_admin()) with check (public.est_admin());

-- Workshops : seuls les publiés sont visibles du public
create policy "lecture des workshops publiés" on public.workshops
  for select using (publie or public.est_admin());
create policy "gestion des workshops" on public.workshops
  for all to authenticated using (public.est_admin()) with check (public.est_admin());

-- Périodes off : gestion uniquement
create policy "gestion des périodes off" on public.periodes_off
  for all to authenticated using (public.est_admin()) with check (public.est_admin());

-- Réservations : aucun accès anonyme. L'élève connecté voit les siennes
-- (même email que son compte), la professeure voit tout. Aucune écriture
-- directe : tout passe par les fonctions ci-dessus.
revoke all on public.reservations from anon;
create policy "l'élève voit ses réservations" on public.reservations
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email') or public.est_admin());

-- Profils : chacun le sien, la professeure les voit tous
revoke all on public.profils from anon;
create policy "l'élève voit son profil" on public.profils
  for select to authenticated using (id = auth.uid() or public.est_admin());
create policy "l'élève modifie son profil" on public.profils
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Admins : RLS activé sans aucune politique = inaccessible via l'API
revoke all on public.admins from anon, authenticated;
