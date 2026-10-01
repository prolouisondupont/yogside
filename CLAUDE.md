# Yogside — Refonte du site

## Le projet

Refonte complète du site d'une professeure de yoga indépendante basée à Tours (37).
Le site actuel (yogside.com) tourne sous WordPress depuis 2021 et devient obsolète :
contenus figés, module de réservation qui affiche ses messages d'erreur en anglais,
tarifs datant de septembre 2025.

L'objectif est double : un site vitrine soigné, et un système de réservation de cours
développé sur mesure.

**Contexte important :** c'est un projet d'apprentissage sur une stack moderne
(Astro + Sanity + Supabase), mené pour une amie. Le site actuel est en production et
lui amène des élèves — rien ne doit être coupé avant que la nouvelle version soit
entièrement fonctionnelle.

## Stack

| Rôle | Outil |
|---|---|
| Front | Astro |
| Contenu éditorial | Sanity |
| Données transactionnelles | Supabase (Postgres) |
| Emails | Resend |
| Hébergement | Vercel (adaptateur `@astrojs/vercel`, tâches planifiées via Vercel Cron) |

Les spécifications complètes (modèle de données, règles métier, emails, étapes)
sont dans **`docs/specs.md`**. Le lire avant toute intervention sur le schéma
de données ou sur la logique de réservation.

## Règles d'architecture — non négociables

**1. Séparation stricte Sanity / Supabase**
Tout ce qui se *lit* va dans Sanity : textes, pages, à-propos, tarifs affichés, photos.
Tout ce qui se *compte* va dans Supabase : lieux, cours, séances, workshops, réservations.
Ne jamais stocker les cours ou les jauges dans Sanity — la capacité et les réservations
doivent partager une seule source de vérité.

**2. Les séances sont des lignes en base, pas un calcul**
Les cours sont des créneaux récurrents (`cours`), mais chaque occurrence réelle existe
comme une ligne dans `seances`, générée 6 à 8 semaines à l'avance par une tâche planifiée.
C'est ce qui permet d'annuler un cours précis, de gérer les vacances et de compter les
inscrits par simple jointure. Ne jamais recalculer les créneaux à la volée.
Un cours n'est jamais modifié une fois ses séances générées : un changement d'horaire
ou de lieu à la rentrée crée de **nouvelles lignes `cours`** pour la nouvelle saison.

**3. La vérification de capacité se fait côté serveur, dans une transaction**
Une fonction Postgres qui verrouille la ligne de la séance, compte les réservations
confirmées, puis insère. Jamais de contrôle de jauge côté navigateur : deux personnes
réservant la dernière place simultanément passeraient toutes les deux.

**4. Comptes élèves optionnels, par lien magique**
*(Décision d'octobre 2026, remplace l'ancienne règle « pas de comptes élèves ».)*
On peut réserver **sans compte** : formulaire + lien d'annulation par jeton dans le mail.
Un élève peut aussi se connecter par lien magique Supabase (pas de mot de passe) pour
retrouver ses réservations à venir et passées, les annuler, modifier son profil et
supprimer son compte. Les réservations sont rattachées au compte **par l'email**
(vérifié par le lien magique) : celles faites avant la création du compte y apparaissent.
Le rôle administrateur est porté par une table dédiée (`admins`), jamais par une
colonne que l'utilisateur pourrait modifier lui-même.

## Métier — ce qu'il faut comprendre

**Deux types de séances :**
- Les **cours en groupe** : créneaux hebdomadaires fixes, qui ne changent qu'une fois
  par an à la rentrée. Hatha flow, Vinyasa, Hatha.
- Les **workshops** : événements ponctuels de 2h30 sur une thématique, créés au cas par cas.

**Quatre lieux à Tours** : Work'in Tours, Colette Gym, Inspire, Le Yoga de Priti.
Chaque cours se tient dans un lieu précis — l'adresse complète doit figurer dans le mail
de confirmation, c'est une information que les élèves cherchent.

**Capacité : 12 personnes par cours.** C'est la règle actuelle, paramétrable par séance.

**Prêt de tapis** : les élèves apportent le leur, mais peuvent demander un prêt à la
réservation. Case à cocher, information remontée dans le mail à la professeure.

## Règles de réservation — arrêtées avec la cliente

**Ouverture** : les réservations sont ouvertes en permanence, dès que la séance existe
en base. L'ancienne règle d'ouverture le samedi midi est abandonnée.

**Fermeture** : une séance n'est plus réservable à partir de son heure de début,
calculée en heure de Paris (`Europe/Paris`), jamais en UTC.

**Séance complète** : le formulaire est désactivé et un message invite à contacter
directement la professeure. **Pas de liste d'attente.**

**Annulation** : possible à tout moment via le lien reçu par mail ou depuis l'espace élève. La règle des 6 heures
et le rattrapage sous deux semaines sont **affichés à titre informatif uniquement** —
aucun contrôle automatique, aucun suivi dans l'outil.

**Abonnements** : **aucun suivi dans l'application.** La professeure gère les abonnements
trimestriels directement avec ses élèves pendant les cours. Les comptes élèves (`profils`)
ne portent aucune notion d'abonné ni de décompte de séances.

**Périodes off** : la professeure déclare ses absences (un jour ou une période). Aucune
séance n'est générée sur ces dates ; les séances déjà existantes sont annulées et les
inscrits prévenus par mail. Les workshops ne sont pas concernés.

**Tarifs** : ceux affichés sur yogside.com « à partir de septembre 2026 » font foi —
18 € le cours à l'unité, carte de 5 séances à 85 € (2 mois), carte de 10 séances à 160 €
(4 mois), abonnement trimestriel 1 cours/semaine à 230 € (16 cours), −15 % sur un second
cours hebdomadaire. Ils sont affichés depuis Sanity et n'ont aucune incidence sur le
système de réservation. Textes complets dans `docs/contenus-site-actuel.md`.

**Newsletter** : conservée, branchée sur la liste Brevo existante (formulaire « Soyez
prévenu des actualités de Yogside » en bas de chaque page). L'inscription passe par une
route serveur Astro ; la clé Brevo reste côté serveur.

**Contenus et effets** : le site actuel est la référence pour les textes, les images et
les effets (apparitions, parallaxe, logo animé, carrousel…), relevés dans
`docs/contenus-site-actuel.md`. La maquette Figma ne sert que pour le design.

## Qui utilise quoi

**Les élèves** : consultent le planning, réservent un cours ou un workshop, reçoivent
une confirmation puis un rappel, peuvent annuler via un lien. S'ils le souhaitent,
ils créent un compte pour retrouver leurs réservations et pré-remplir le formulaire.

**La professeure** : modifie ses textes et ses tarifs dans Sanity, consulte le planning
et les jauges dans l'espace de gestion, voit la liste des inscrits, annule une séance,
crée un workshop, déclare ses périodes off, met à jour ses créneaux une fois par an. Elle n'est pas technicienne —
tout ce qu'elle doit faire au quotidien passe par une interface, jamais par Supabase.

## Conventions de code

- Code, commentaires et messages de commit **en français**
- Noms de tables et de colonnes en français, au pluriel pour les tables
  (`cours`, `seances`, `reservations`, `lieux`, `workshops`)
- Pas de framework CSS lourd : CSS natif ou Tailwind, au choix, mais pas les deux
- TypeScript partout où Astro le permet
- Les composants Astro restent statiques par défaut ; l'interactivité est ajoutée
  par îlots uniquement là où elle est nécessaire (formulaire de réservation, admin)

## Sécurité

- Clés Supabase, Sanity et Resend dans `.env`, jamais dans le dépôt
- `.env` dans `.gitignore` dès le premier commit
- La clé de service Supabase ne doit jamais être exposée côté client :
  uniquement dans les routes serveur Astro
- Row Level Security activée sur toutes les tables
- Les vues exposées au public sont créées avec `security_invoker` et ne renvoient
  que des chiffres (jauges), jamais de données personnelles
- Les données personnelles collectées (nom, email, téléphone) sont minimales
  et destinées au seul usage de la réservation ; la suppression d'un compte efface
  le profil et anonymise les réservations associées

## Ce qu'il ne faut pas faire

- Toucher au site WordPress actuel ou à son DNS avant validation complète
- Ajouter du paiement en ligne — hors périmètre, décidé avec la cliente
- Créer un suivi d'abonnement ou un décompte de séances
- Rendre le compte obligatoire pour réserver
- Implémenter une liste d'attente
- Automatiser le contrôle des règles d'annulation ou de rattrapage
