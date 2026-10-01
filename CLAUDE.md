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
| Hébergement | Vercel ou Cloudflare Pages |

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

**3. La vérification de capacité se fait côté serveur, dans une transaction**
Une fonction Postgres qui verrouille la ligne de la séance, compte les réservations
confirmées, puis insère. Jamais de contrôle de jauge côté navigateur : deux personnes
réservant la dernière place simultanément passeraient toutes les deux.

**4. Pas de comptes élèves**
Il n'y a pas de paiement en ligne, donc pas d'authentification côté public.
L'annulation se fait par un jeton unique inclus dans le lien du mail de confirmation.
Seul l'espace de gestion est protégé, par lien magique Supabase.

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

**Fermeture** : une séance n'est plus réservable à partir de son heure de début.

**Séance complète** : le formulaire est désactivé et un message invite à contacter
directement la professeure. **Pas de liste d'attente.**

**Annulation** : possible à tout moment via le lien reçu par mail. La règle des 6 heures
et le rattrapage sous deux semaines sont **affichés à titre informatif uniquement** —
aucun contrôle automatique, aucun suivi dans l'outil.

**Abonnements** : **aucun suivi dans l'application.** La professeure gère les abonnements
trimestriels directement avec ses élèves pendant les cours. Ne pas créer de table `eleves`,
ni de notion d'abonné, ni de décompte de séances.

**Tarifs** : ceux de 2025 sont reconduits — 18 € le cours à l'unité, abonnement trimestriel
à 210 €, −15 % sur un second cours hebdomadaire. Ils sont affichés depuis Sanity et n'ont
aucune incidence sur le système de réservation.

## Qui utilise quoi

**Les élèves** : consultent le planning, réservent un cours ou un workshop, reçoivent
une confirmation puis un rappel, peuvent annuler via un lien.

**La professeure** : modifie ses textes et ses tarifs dans Sanity, consulte le planning
et les jauges dans l'espace de gestion, voit la liste des inscrits, annule une séance,
crée un workshop, met à jour ses créneaux une fois par an. Elle n'est pas technicienne —
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
- Les données personnelles collectées (nom, email, téléphone) sont minimales
  et destinées au seul usage de la réservation

## Ce qu'il ne faut pas faire

- Toucher au site WordPress actuel ou à son DNS avant validation complète
- Ajouter du paiement en ligne — hors périmètre, décidé avec la cliente
- Créer un système de comptes élèves ou un suivi d'abonnement
- Implémenter une liste d'attente
- Automatiser le contrôle des règles d'annulation ou de rattrapage
