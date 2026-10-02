# Yogside — Refonte · Spécifications techniques

Stack : **Astro** (front) · **Sanity** (contenu éditorial) · **Supabase** (réservations) · **Resend** (emails) · **Vercel** (hébergement, adaptateur `@astrojs/vercel`, tâches planifiées via Vercel Cron)

> **Décisions d'octobre 2026** intégrées à ce document : comptes élèves optionnels par lien magique, périodes off, nouvelle saison = nouvelles lignes `cours`, fuseau `Europe/Paris`, unicité limitée aux réservations confirmées, jauge des workshops, vues en `security_invoker`, hébergement Vercel.

---

## 1. Répartition Sanity / Supabase

La règle est simple et évite tout problème de synchronisation :

**Sanity** = tout ce qui se lit. Pages, textes, à-propos, tarifs, photos, articles. La professeure y modifie son contenu librement, ça ne touche à rien d'autre.

**Supabase** = tout ce qui se compte. Lieux, cours, séances, workshops, réservations. Dès qu'il y a une jauge ou une inscription, c'est ici.

Ne mets jamais les cours dans Sanity : la capacité et les réservations doivent vivre au même endroit, sinon tu passeras ton temps à synchroniser deux sources de vérité.

> **Implémentation** : projet Sanity `vl8aocgi` (organisation « Yogside »), jeu de données `production` public en lecture. Studio dans `studio/`, en ligne sur https://yogside.sanity.studio. Une fiche unique par page (Accueil, Les cours, À propos, Événements, Réglages généraux). Les pages éditoriales sont rendues côté serveur avec un cache Vercel d'une minute : une publication apparaît sur le site en une à deux minutes, sans webhook ni reconstruction. Les horaires et les dates des workshops restent lus dans Supabase ; Sanity ne fournit que l'habillage (textes, photos). Import initial : `npm run import` dans `studio/`.

---

## 2. Modèle de données Supabase

### `lieux`
| colonne | type | note |
|---|---|---|
| id | uuid | clé primaire |
| nom | text | « Work'in Tours », « Colette Gym », « Inspire », « Le Yoga de Priti » |
| adresse | text | |
| code_postal | text | l'adresse complète figure dans le mail de confirmation |
| ville | text | « Tours » par défaut |
| actif | bool | permet de retirer un lieu sans perdre l'historique |

### `cours` — les créneaux récurrents
| colonne | type | note |
|---|---|---|
| id | uuid | |
| nom | text | « Hatha flow », « Vinyasa », « Hatha » |
| description | text | |
| lieu_id | uuid → lieux | |
| jour_semaine | int | 1 = lundi … 7 = dimanche |
| heure_debut | time | |
| heure_fin | time | |
| capacite | int | 12 par défaut |
| saison_debut | date | ex. 08/09/2026 |
| saison_fin | date | ex. 20/12/2026 |
| actif | bool | |

C'est la table qu'elle met à jour une fois par an. **Un cours n'est jamais modifié une fois ses séances générées** : si un horaire ou un lieu change à la rentrée, on crée de nouvelles lignes `cours` pour la nouvelle saison (`saison_debut` / `saison_fin`), et les anciennes restent intactes pour l'historique. C'est pour ça que `seances` n'a pas besoin de recopier les heures ni le lieu.

### `seances` — les occurrences réelles
| colonne | type | note |
|---|---|---|
| id | uuid | |
| cours_id | uuid → cours | |
| date | date | |
| capacite | int | recopiée du cours, modifiable au cas par cas |
| annulee | bool | pour les vacances, les absences |
| motif_annulation | text | |

**C'est la décision d'architecture la plus importante du projet.** Plutôt que de calculer les créneaux à la volée, on crée une ligne par séance réelle. Ça permet d'annuler un cours précis, de changer la capacité d'une fois, de gérer les vacances scolaires, et surtout de compter les inscrits avec une simple jointure. Une tâche planifiée génère les séances six à huit semaines à l'avance, en sautant les dates couvertes par une période off. Unicité sur `(cours_id, date)` pour que la génération puisse tourner plusieurs fois sans créer de doublons.

### `periodes_off` — les absences de la professeure
| colonne | type | note |
|---|---|---|
| id | uuid | |
| date_debut | date | |
| date_fin | date | égale à `date_debut` pour un seul jour ; contrainte `date_fin >= date_debut` |
| motif | text | repris dans le mail d'annulation aux inscrits |
| created_at | timestamptz | |

À la création d'une période off :
- la génération ne crée plus de séance sur ces dates ;
- les séances déjà générées sur la période passent à `annulee = true` avec le motif, et leurs inscrits reçoivent le mail d'annulation.

Les workshops ne sont pas concernés : elle les crée elle-même, au cas par cas.

### `workshops` — les événements ponctuels
| colonne | type | note |
|---|---|---|
| id | uuid | |
| titre | text | |
| description | text | |
| lieu_id | uuid → lieux | |
| date | date | |
| heure_debut / heure_fin | time | |
| capacite | int | |
| tarif | numeric | affiché seulement, pas d'encaissement |
| publie | bool | |
| annule / motif_annulation / annule_le | | annulation d'un workshop, avec mail aux inscrits |

### `reservations`
| colonne | type | note |
|---|---|---|
| id | uuid | |
| seance_id | uuid → seances | nullable |
| workshop_id | uuid → workshops | nullable |
| prenom / nom | text | |
| email | text | toujours stocké en minuscules — sert aussi à rattacher la réservation au compte élève |
| telephone | text | |
| pret_tapis | bool | « si besoin me prévenir pour le prêt du tapis » |
| message | text | |
| statut | enum | `confirmee` · `annulee` |
| jeton | uuid | sert au lien d'annulation, unique |
| annulee_le | timestamptz | |
| anonymisee_le | timestamptz | rempli à la suppression du compte ; prénom, nom, email et téléphone sont alors vidés |
| created_at | timestamptz | |

Contrainte à poser : exactement l'un des deux parmi `seance_id` et `workshop_id` doit être rempli.

**Aucun suivi d'abonnement.** La professeure gère les abonnements directement avec ses élèves pendant les cours — le site n'en a pas connaissance.

### `profils` — les comptes élèves (optionnels)
| colonne | type | note |
|---|---|---|
| id | uuid | = `auth.users.id`, supprimé en cascade avec le compte |
| prenom / nom | text | pré-remplissent le formulaire de réservation |
| telephone | text | |
| created_at | timestamptz | |

Pas de colonne `email` : c'est celui du compte Supabase Auth, vérifié par le lien magique. **Pas de clé étrangère depuis `reservations`** : une réservation appartient à un compte quand son email est celui du compte. Les réservations faites sans compte, avant l'inscription, apparaissent donc d'elles-mêmes dans l'espace élève.

### `admins`
| colonne | type | note |
|---|---|---|
| user_id | uuid → auth.users | clé primaire |

Le rôle d'administratrice est porté par cette table, alimentée à la main. Aucune politique RLS n'y autorise l'écriture : un élève ne peut pas s'y ajouter. Une fonction `est_admin()` sert dans toutes les politiques.

### Index et contraintes utiles
- Unicité sur `(seance_id, email)` et `(workshop_id, email)` **uniquement pour les réservations au statut `confirmee`** (index unique partiel), pour éviter les doubles inscriptions tout en permettant de se réinscrire après une annulation
- Index sur `seances(date)` pour l'affichage du planning
- Index sur `reservations(jeton)` pour le lien d'annulation

---

## 3. Règles de réservation

**Ouverture.** Les réservations sont ouvertes en permanence, dès que la séance existe en base. Pas d'ouverture temporisée — la règle du samedi midi du site actuel est abandonnée.

**Fermeture.** Une séance n'est plus réservable à partir de son heure de début, calculée en heure de Paris : `(date + heure_debut) at time zone 'Europe/Paris'`, comparée à `now()`. Jamais de calcul en UTC, sinon tout est décalé d'une à deux heures selon la saison. *(Valeur par défaut : si la professeure préfère fermer une ou deux heures avant, c'est un simple paramètre à ajuster.)*

**Séance complète.** Quand `places_restantes` tombe à zéro, la séance s'affiche comme complète, le formulaire est désactivé et un message invite à contacter directement la professeure. **Pas de liste d'attente.**

**Annulation.** L'élève annule à tout moment, via le lien reçu par mail ou depuis son espace élève s'il a un compte. La règle des 6 heures et le rattrapage sous deux semaines sont **affichés sur le site à titre informatif uniquement** — aucun contrôle automatique, aucun suivi dans l'outil. La professeure gère ces cas de vive voix.

**Tarifs.** Ceux affichés sur le site actuel à partir de septembre 2026 : 18 € le cours à l'unité, carte 5 séances 85 €, carte 10 séances 160 €, abonnement trimestriel 230 € (16 cours), −15 % sur un second cours hebdomadaire. Ils sont **affichés depuis Sanity**, sans aucune incidence sur le système de réservation.

**Newsletter.** Conservée : formulaire en bas de chaque page, inscription envoyée à la liste Brevo existante par une route serveur Astro (`BREVO_API_KEY` et identifiant de liste dans `.env`).

---

## 4. La jauge

Une vue SQL fait tout le travail. Elle est créée avec `security_invoker = true` (sinon, dans Supabase, une vue contourne le RLS des tables) et ne renvoie que des chiffres, jamais de données personnelles. La version finale joint aussi `cours` pour exposer l'heure de début et un booléen `reservable`.

> **Implémentation retenue** (`supabase/migrations/`) : le public n'a aucun accès à `reservations`, donc la vue ne peut pas compter elle-même. Elle appelle `nb_inscrits_seance()` / `nb_inscrits_workshop()`, deux fonctions `security definer` qui ne renvoient qu'un nombre. Les séances annulées restent dans la vue (colonne `annulee`) pour pouvoir les afficher barrées sur le planning. L'esquisse ci-dessous reste valable pour comprendre le principe.

```sql
create view seances_disponibilite with (security_invoker = true) as
select
  s.id,
  s.date,
  s.capacite,
  count(r.id) filter (where r.statut = 'confirmee') as inscrits,
  s.capacite - count(r.id) filter (where r.statut = 'confirmee') as places_restantes
from seances s
left join reservations r on r.seance_id = s.id
where s.annulee = false
group by s.id;
```

Une vue équivalente, `workshops_disponibilite`, fait la même chose pour les workshops publiés.

La fonction de réservation (`reserver`) gère les deux cas : séance ou workshop. Elle verrouille la ligne concernée (`select … for update`), vérifie qu'elle n'est ni annulée ni commencée, compte les réservations confirmées, puis insère — tout dans la même transaction. Elle n'est exécutable qu'avec la clé de service, donc uniquement depuis une route serveur Astro.

Les erreurs sont des codes courts, traduits en français côté front : `cible_invalide`, `donnees_invalides`, `introuvable`, `annulee`, `commencee`, `deja_inscrit`, `complet`.

### Fonctions disponibles
| fonction | appelée par | rôle |
|---|---|---|
| `reserver(...)` | route serveur | réservation transactionnelle |
| `annuler_par_jeton(jeton)` | route serveur | lien d'annulation du mail |
| `annuler_ma_reservation(id)` | élève connecté | annulation depuis l'espace élève |
| `annuler_seance(id, motif)` · `annuler_workshop(id, motif)` | admin | renvoient les réservations à prévenir |
| `creer_periode_off(debut, fin, motif)` | admin | crée l'absence, annule les séances, renvoie les réservations à prévenir |
| `generer_seances(jusqu_au?)` | tâche planifiée | 8 semaines par défaut, saute les périodes off, idempotente |
| `anonymiser_reservations(email)` | route serveur | suppression de compte |

**Attention au point critique :** la vérification de la jauge doit se faire **côté serveur, dans une transaction**, pas dans le navigateur. Sinon deux personnes qui réservent la douzième place en même temps passent toutes les deux. Une fonction Postgres qui verrouille la ligne de la séance, compte, puis insère — c'est exactement le genre de chose que Webflow ne sait pas faire, et une bonne raison de ce projet.

---

## 5. Les emails (Resend)

**À l'élève, après réservation :** confirmation avec le cours, la date, l'heure, l'adresse complète du lieu, le rappel du tapis, le rappel de la règle d'annulation, et le lien d'annulation.

**À l'élève, 24 h avant :** rappel, via une tâche planifiée quotidienne.

**À l'élève, si la séance est annulée :** information immédiate avec le motif (annulation ponctuelle ou période off).

**À l'élève, connexion :** le lien magique est généré côté serveur (`auth.admin.generateLink`) puis envoyé par Resend avec notre propre modèle en français. Aucun réglage SMTP chez Supabase. Le lien mène à une page avec un bouton « Me connecter » (POST) pour que les antivirus de messagerie ne consomment pas le lien. Un lien par minute et par adresse au maximum (table `limites_envoi`). Cookies de session `httpOnly`.

**À la professeure, à chaque réservation :** nom, email, téléphone, prêt de tapis éventuel, cours concerné, et la jauge mise à jour (« 9/12 »).

**À la professeure, le dimanche soir :** récapitulatif de la semaine à venir, cours par cours, avec la liste des inscrits. C'est le mail qu'elle lira vraiment.

Le lien d'annulation contient un jeton unique par réservation — pas besoin de compte élève, ce qui simplifie énormément le projet.

---

## 6. L'espace élève

Un compte est **optionnel** : on peut toujours réserver sans compte. On se connecte par lien magique Supabase, sans mot de passe. Le compte est créé à la première connexion.

Ce que l'élève peut faire :
- Voir ses réservations à venir et les annuler en un clic
- Voir l'historique des séances et workshops auxquels il était inscrit
- Modifier son profil (prénom, nom, téléphone), qui pré-remplit ensuite le formulaire de réservation
- Supprimer son compte : ses réservations à venir sont annulées, les passées sont anonymisées (nom, email et téléphone effacés), puis le profil et le compte Auth sont supprimés. La suppression passe par une route serveur Astro, qui seule détient la clé de service.

L'espace élève ne montre aucune notion d'abonnement ni de décompte de séances.

---

## 7. L'espace de gestion

Une page admin dans Astro, protégée par l'authentification par lien magique de Supabase. Pas de mot de passe à retenir. L'accès est réservé aux comptes présents dans la table `admins`.

Ce qu'elle doit pouvoir faire :
- Voir le planning de la semaine avec les jauges
- Ouvrir une séance et voir la liste des inscrits
- Annuler une séance, avec email automatique aux inscrits
- Déclarer une période off (un jour ou une période), avec annulation des séances concernées et email aux inscrits
- Créer et publier un workshop
- Modifier les créneaux récurrents en début de saison
- Exporter une liste en CSV

> **Implémentation** (`/admin`, réservé à la table `admins`) : planning hebdomadaire navigable, fiche séance (inscrits, export CSV Excel, capacité, annulation + mails), workshops (brouillon / publié, modification, annulation + mails), périodes off (annulation des séances + mails), créneaux (ajout, modification tant qu'aucune séance n'existe, désactivation, « Préparer la saison suivante » qui recopie les créneaux avec les nouvelles dates) et lieux. Toutes les écritures passent par la session de l'administratrice, donc par le RLS.

Pour les premières semaines, l'interface Supabase suffit à dépanner — mais elle n'est pas pour une non-technicienne, donc la page admin fait partie du périmètre.

---

## 8. Les étapes

1. Schéma Supabase (dont `periodes_off`, `profils`, `admins`), vues de disponibilité, fonction de réservation transactionnelle, politiques RLS
2. Jeu de données réel : les quatre lieux, les créneaux de la saison en cours
3. Front Astro : planning, page cours, formulaire de réservation
4. Emails Resend et tâches planifiées
5. Espace élève : connexion par lien magique, mes réservations, profil, suppression du compte
6. Page admin
7. Contenu éditorial dans Sanity et branchement
8. Recette sur une adresse de test, puis bascule DNS

---

## 9. Points de vigilance

Le site actuel affiche des **messages d'erreur en anglais** sur la page Réservation, et son flux Instagram déverse des légendes du type « réservation lien en bio » dans le contenu. À vérifier à l'œil avant d'en parler à la cliente.

Le site est servi en **http://** — contrôler le certificat SSL, un site de réservation sans HTTPS fait fuir les navigateurs.

Enfin : **ne rien couper avant la bascule.** Son activité tourne sur ce site. Développer sur une adresse de test et ne toucher au DNS que quand une réservation complète fonctionne de bout en bout.
