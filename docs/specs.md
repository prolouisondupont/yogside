# Yogside — Refonte · Spécifications techniques

Stack : **Astro** (front) · **Sanity** (contenu éditorial) · **Supabase** (réservations) · **Resend** (emails) · **Vercel** ou **Cloudflare** (hébergement)

---

## 1. Répartition Sanity / Supabase

La règle est simple et évite tout problème de synchronisation :

**Sanity** = tout ce qui se lit. Pages, textes, à-propos, tarifs, photos, articles. La professeure y modifie son contenu librement, ça ne touche à rien d'autre.

**Supabase** = tout ce qui se compte. Lieux, cours, séances, workshops, réservations. Dès qu'il y a une jauge ou une inscription, c'est ici.

Ne mets jamais les cours dans Sanity : la capacité et les réservations doivent vivre au même endroit, sinon tu passeras ton temps à synchroniser deux sources de vérité.

---

## 2. Modèle de données Supabase

### `lieux`
| colonne | type | note |
|---|---|---|
| id | uuid | clé primaire |
| nom | text | « Work'in Tours », « Colette Gym », « Inspire », « Le Yoga de Priti » |
| adresse | text | |
| ville | text | |
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

C'est la table qu'elle modifie une fois par an.

### `seances` — les occurrences réelles
| colonne | type | note |
|---|---|---|
| id | uuid | |
| cours_id | uuid → cours | |
| date | date | |
| capacite | int | recopiée du cours, modifiable au cas par cas |
| annulee | bool | pour les vacances, les absences |
| motif_annulation | text | |

**C'est la décision d'architecture la plus importante du projet.** Plutôt que de calculer les créneaux à la volée, on crée une ligne par séance réelle. Ça permet d'annuler un cours précis, de changer la capacité d'une fois, de gérer les vacances scolaires, et surtout de compter les inscrits avec une simple jointure. Une tâche planifiée génère les séances six à huit semaines à l'avance.

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

### `reservations`
| colonne | type | note |
|---|---|---|
| id | uuid | |
| seance_id | uuid → seances | nullable |
| workshop_id | uuid → workshops | nullable |
| prenom / nom | text | |
| email | text | |
| telephone | text | |
| pret_tapis | bool | « si besoin me prévenir pour le prêt du tapis » |
| message | text | |
| statut | enum | `confirmee` · `annulee` |
| jeton | uuid | sert au lien d'annulation, unique |
| annulee_le | timestamptz | |
| created_at | timestamptz | |

Contrainte à poser : exactement l'un des deux parmi `seance_id` et `workshop_id` doit être rempli.

**Aucune table `eleves`, aucun suivi d'abonnement.** La professeure gère les abonnements directement avec ses élèves pendant les cours — le site n'en a pas connaissance.

### Index et contraintes utiles
- Unicité sur `(seance_id, email)` et `(workshop_id, email)` pour éviter les doubles inscriptions
- Index sur `seances(date)` pour l'affichage du planning
- Index sur `reservations(jeton)` pour le lien d'annulation

---

## 3. Règles de réservation

**Ouverture.** Les réservations sont ouvertes en permanence, dès que la séance existe en base. Pas d'ouverture temporisée — la règle du samedi midi du site actuel est abandonnée.

**Fermeture.** Une séance n'est plus réservable à partir de son heure de début. *(Valeur par défaut : si la professeure préfère fermer une ou deux heures avant, c'est un simple paramètre à ajuster.)*

**Séance complète.** Quand `places_restantes` tombe à zéro, la séance s'affiche comme complète, le formulaire est désactivé et un message invite à contacter directement la professeure. **Pas de liste d'attente.**

**Annulation.** L'élève annule via le lien reçu par mail, à tout moment. La règle des 6 heures et le rattrapage sous deux semaines sont **affichés sur le site à titre informatif uniquement** — aucun contrôle automatique, aucun suivi dans l'outil. La professeure gère ces cas de vive voix.

**Tarifs.** Ceux de 2025 sont reconduits : 18 € le cours à l'unité, abonnement trimestriel à 210 €, −15 % sur un second cours hebdomadaire. Ils sont **affichés depuis Sanity**, sans aucune incidence sur le système de réservation.

---

## 4. La jauge

Une vue SQL fait tout le travail :

```sql
create view seances_disponibilite as
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

**Attention au point critique :** la vérification de la jauge doit se faire **côté serveur, dans une transaction**, pas dans le navigateur. Sinon deux personnes qui réservent la douzième place en même temps passent toutes les deux. Une fonction Postgres qui verrouille la ligne de la séance, compte, puis insère — c'est exactement le genre de chose que Webflow ne sait pas faire, et une bonne raison de ce projet.

---

## 5. Les emails (Resend)

**À l'élève, après réservation :** confirmation avec le cours, la date, l'heure, l'adresse complète du lieu, le rappel du tapis, le rappel de la règle d'annulation, et le lien d'annulation.

**À l'élève, 24 h avant :** rappel, via une tâche planifiée quotidienne.

**À l'élève, si la séance est annulée :** information immédiate avec le motif.

**À la professeure, à chaque réservation :** nom, email, téléphone, prêt de tapis éventuel, cours concerné, et la jauge mise à jour (« 9/12 »).

**À la professeure, le dimanche soir :** récapitulatif de la semaine à venir, cours par cours, avec la liste des inscrits. C'est le mail qu'elle lira vraiment.

Le lien d'annulation contient un jeton unique par réservation — pas besoin de compte élève, ce qui simplifie énormément le projet.

---

## 6. L'espace de gestion

Une page admin dans Astro, protégée par l'authentification par lien magique de Supabase. Pas de mot de passe à retenir.

Ce qu'elle doit pouvoir faire :
- Voir le planning de la semaine avec les jauges
- Ouvrir une séance et voir la liste des inscrits
- Annuler une séance, avec email automatique aux inscrits
- Créer et publier un workshop
- Modifier les créneaux récurrents en début de saison
- Exporter une liste en CSV

Pour les premières semaines, l'interface Supabase suffit à dépanner — mais elle n'est pas pour une non-technicienne, donc la page admin fait partie du périmètre.

---

## 7. Les étapes

1. Schéma Supabase, vue de disponibilité, fonction de réservation transactionnelle, politiques RLS
2. Jeu de données réel : les quatre lieux, les créneaux de la saison en cours
3. Front Astro : planning, page cours, formulaire de réservation
4. Emails Resend et tâches planifiées
5. Page admin
6. Contenu éditorial dans Sanity et branchement
7. Recette sur une adresse de test, puis bascule DNS

---

## 8. Points de vigilance

Le site actuel affiche des **messages d'erreur en anglais** sur la page Réservation, et son flux Instagram déverse des légendes du type « réservation lien en bio » dans le contenu. À vérifier à l'œil avant d'en parler à la cliente.

Le site est servi en **http://** — contrôler le certificat SSL, un site de réservation sans HTTPS fait fuir les navigateurs.

Enfin : **ne rien couper avant la bascule.** Son activité tourne sur ce site. Développer sur une adresse de test et ne toucher au DNS que quand une réservation complète fonctionne de bout en bout.
