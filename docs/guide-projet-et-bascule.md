# Yogside — Guide du projet et de la bascule WordPress → nouveau site

> **À qui s'adresse ce document.** Il est écrit pour être collé dans une conversation
> avec un assistant (Claude chat) qui **n'a pas accès au code**, afin qu'il puisse
> aider Louison à remplacer le site WordPress actuel par le nouveau site.
> Il décrit ce qui existe, où ça se trouve, ce qui reste à faire, et dans quel ordre.
>
> Rédigé le 27/11/2026, à partir de l'état du dépôt après le commit
> « Contenus éditoriaux dans Sanity ».

---

## 0. Consignes pour l'assistant qui lit ce document

- **Louison est designer** (habitué de Webflow, Figma, Vercel). Il découvre Astro, Sanity
  et Supabase. Expliquer simplement, en français, avec des analogies Webflow quand
  ça aide (voir le glossaire, §12).
- **Le site WordPress actuel est en production** et amène des élèves à la professeure.
  Rien ne doit être coupé tant que le nouveau site n'est pas validé de bout en bout.
  En cas de doute, proposer l'option qui laisse un retour arrière possible.
- **Ne jamais demander ni recopier de clé secrète** (clé de service Supabase, clé Resend,
  clé Brevo, `CRON_SECRET`). Elles vivent dans `.env` en local et dans les variables
  d'environnement Vercel, nulle part ailleurs.
- **Les règles du §11 sont non négociables** (pas de paiement, pas de liste d'attente,
  pas de suivi d'abonnement…). Ne pas les proposer comme « amélioration ».
- Le code se modifie avec **Claude Code** dans le dépôt. Le rôle de l'assistant est
  d'expliquer, de préparer les étapes, de relire et de rédiger les consignes ; quand une
  modification de code est nécessaire, la décrire précisément (fichier, intention) pour
  que Louison la fasse faire dans Claude Code.

---

## 1. Le projet en bref

**Yogside** est l'activité de **Mathilde Bertrand**, professeure de yoga indépendante à
Tours (37). Son site actuel, **yogside.com**, tourne sous WordPress (thème Elementor,
réalisé en 2022 par l'agence Panopli). Il vieillit : contenus figés, module de réservation
aux messages d'erreur en anglais, règles d'inscription dépassées.

La refonte a deux objectifs :

1. **Un site vitrine soigné** qui reprend les textes, photos et effets du site actuel
   (apparitions au défilement, parallaxe, soleil animé, carrousel…), sur le design de la
   maquette Figma.
2. **Un système de réservation sur mesure** : planning, jauges en temps réel, réservation
   sans compte, mails de confirmation et de rappel, annulation par lien, espace élève
   optionnel, et un espace de gestion pour Mathilde.

C'est aussi un **projet d'apprentissage** pour Louison, mené pour une amie.

### Les acteurs

| Qui | Ce qu'il fait |
|---|---|
| **Les élèves** | Consultent le planning, réservent un cours ou un workshop (sans compte), reçoivent une confirmation puis un rappel la veille, annulent par le lien du mail. Peuvent créer un compte (lien magique, sans mot de passe) pour retrouver leurs réservations. |
| **Mathilde** (la professeure, non technicienne) | Modifie ses textes, photos et tarifs dans **Sanity Studio**. Gère planning, inscrits, workshops, absences et créneaux dans l'**espace de gestion** du site (`/admin`). Ne touche jamais à Supabase directement. |
| **Louison** | Développe, déploie, fait la bascule. |

---

## 2. Où en est le projet

Les spécifications prévoient 8 étapes. **Les 7 premières sont faites.** Il reste la 8ᵉ :
la recette et la bascule — c'est l'objet de ce document.

| # | Étape | État |
|---|---|---|
| 1 | Schéma Supabase : tables, jauges, réservation transactionnelle, sécurité (RLS) | ✅ |
| 2 | Données réelles : 5 lieux, 6 créneaux de la saison 2026-2027, workshops à venir | ✅ |
| 3 | Pages du site : accueil, cours, à propos, événements, planning, réservation | ✅ |
| 4 | Emails (Resend) et tâches planifiées (Vercel Cron) | ✅ |
| 5 | Espace élève : connexion par lien magique, réservations, profil, suppression | ✅ |
| 6 | Espace de gestion `/admin` | ✅ |
| 7 | Contenus éditoriaux dans Sanity, branchés sur les pages | ✅ |
| 8 | **Recette sur l'adresse de test, puis bascule DNS** | ⏳ à faire |

Le nouveau site tourne déjà sur une **adresse de test Vercel** : `https://yogside.vercel.app`.
Il est volontairement **non indexé** par Google (voir §8.3) et ses mails peuvent être
**redirigés vers une adresse de test** (variable `EMAIL_REDIRECTION`).

> **État à jour** : ce guide décrit le projet à la date de sa rédaction. Ce qui a été fait
> depuis, la checklist de bascule cochée et les questions en suspens sont dans
> `docs/avancement.md`, mis à jour à chaque session.

---

## 3. Les outils et les comptes

| Rôle | Outil | Où | Identifiants publics |
|---|---|---|---|
| Front (pages, formulaires, routes serveur) | **Astro 7** | dépôt GitHub `prolouisondupont/yogside` | — |
| Hébergement + tâches planifiées | **Vercel** (adaptateur `@astrojs/vercel`) | projet Vercel relié au dépôt, déploiement à chaque push sur `main` | `yogside.vercel.app` |
| Contenu éditorial | **Sanity** | Studio en ligne : https://yogside.sanity.studio | projet `vl8aocgi`, jeu de données `production` |
| Base de données + comptes | **Supabase** (Postgres) | tableau de bord Supabase | projet `vrgwjqawblmsrpxhsgex` |
| Emails transactionnels | **Resend** | domaine `yogside.com` **déjà vérifié** | expéditeur `reservation@yogside.com` |
| Newsletter | **Brevo** (liste existante du site actuel) | compte Brevo de Mathilde | clés à récupérer |
| Nom de domaine, DNS, boîte mail `info@yogside.com` | **OVH** | accès obtenu par Louison le 01/10/2026 | — |
| Fichiers du WordPress actuel | **o2switch** | à résilier **après** la bascule | IP actuelle : `109.234.164.55` |

### Variables d'environnement

Elles sont listées dans `.env.example` (valeurs secrètes vides). Elles doivent exister
**à la fois** dans `.env` (développement local) et dans **Vercel → Settings → Environment
Variables** (production).

| Variable | Rôle | Secrète ? |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | adresse du projet Supabase | non |
| `PUBLIC_SUPABASE_ANON_KEY` | clé publique Supabase (lectures soumises au RLS) | non |
| `SUPABASE_SERVICE_ROLE_KEY` | clé de service, contourne la sécurité — **serveur uniquement** | **oui** |
| `PUBLIC_SANITY_PROJECT_ID` / `PUBLIC_SANITY_DATASET` | `vl8aocgi` / `production` | non |
| `RESEND_API_KEY` | envoi des mails | **oui** |
| `BREVO_API_KEY` / `BREVO_LISTE_ID` | inscription newsletter | **oui** / non |
| `EMAIL_EXPEDITEUR` | `Yogside <reservation@yogside.com>` | non |
| `EMAIL_PROF` | `info@yogside.com` — reçoit les avis de réservation et le récap du dimanche | non |
| `EMAIL_REDIRECTION` | **en test** : tous les mails partent vers cette adresse. **Vide en production.** | non |
| `PUBLIC_SITE_URL` | adresse du site, utilisée dans les liens des mails. `https://yogside.vercel.app` en test, `https://yogside.com` en production | non |
| `CRON_SECRET` | protège les tâches planifiées (chaîne aléatoire) | **oui** |

---

## 4. Le principe d'architecture : qui stocke quoi

C'est **la** règle du projet :

- **Sanity = tout ce qui se lit.** Textes, titres, photos, tarifs affichés, réglages de
  contact, bande de photos, textes de la newsletter. Mathilde modifie librement, ça ne
  casse rien d'autre. Une publication apparaît sur le site en **une à deux minutes**
  (cache Vercel d'une minute, pas de reconstruction du site).
- **Supabase = tout ce qui se compte.** Lieux, créneaux, séances, workshops, réservations,
  comptes élèves, administratrices. Dès qu'il y a une jauge ou une inscription, c'est ici.

Conséquence pratique : sur la page « Les cours », la **description** d'un cours vient de
Sanity mais ses **horaires** viennent de Supabase. Le lien entre les deux se fait **par le
nom** : le champ « Nom du cours » dans Sanity doit être écrit exactement comme dans
l'espace de gestion (« Hatha flow », « Vinyasa »). Même chose pour les événements : un
« type d'événement » Sanity est relié aux workshops par leur titre exact
(« Workshop yoga », « Yin & bain sonore »).

---

## 5. Le code — arborescence commentée

```
Yogside/
├── CLAUDE.md                 Règles du projet (lues par Claude Code)
├── docs/
│   ├── specs.md              Spécifications complètes (données, règles, emails)
│   ├── contenus-site-actuel.md  Relevé du site WordPress, page par page
│   └── guide-projet-et-bascule.md  Ce document
├── astro.config.mjs          Config Astro (adaptateur Vercel)
├── vercel.json               Tâches planifiées (crons)
├── public/                   Fichiers servis tels quels (favicon, robots.txt, logo des mails)
├── src/
│   ├── pages/                Une page = un fichier = une URL (comme les pages Webflow)
│   ├── layouts/              Gabarits : Base.astro (site public), Admin.astro (gestion)
│   ├── components/           Blocs réutilisables (en-tête, pied de page, jauge, carrousel…)
│   ├── lib/                  Logique : accès Sanity, Supabase, mails, réservation, dates
│   ├── scripts/effets.ts     Effets d'animation (apparitions, parallaxe, rotation)
│   ├── styles/               CSS natif : variables.css (couleurs, typo) + global.css
│   └── assets/site-actuel/   Photos récupérées du site WordPress
├── studio/                   Sanity Studio (projet séparé, son propre package.json)
│   ├── schemas/              Modèle de contenu : une fiche par page
│   └── scripts/              Import initial des contenus du site actuel
└── supabase/migrations/      Le schéma de la base, en SQL, versionné
```

### Les pages du nouveau site

| URL | Contenu | Rendu |
|---|---|---|
| `/` | Accueil : titre, photo, cartes des cours (photo qui change au survol), bloc Mathilde | serveur + cache 1 min |
| `/cours` | Présentation Hatha flow / Vinyasa / Workshops avec horaires (Supabase), tarifs, philosophie | serveur + cache |
| `/a-propos` | Parcours de Mathilde, citation, photos en parallaxe | serveur + cache |
| `/evenements` | Workshops à venir, regroupés par type, avec jauge et lien de réservation | serveur |
| `/planning` | Planning des 4 prochaines semaines, jauges, séances annulées barrées | serveur |
| `/reserver/seance/[id]` · `/reserver/workshop/[id]` | Formulaire de réservation (prénom, nom, email, téléphone, prêt de tapis, message) | serveur |
| `/reserver/confirmation/[id]` | Page de confirmation | serveur |
| `/annuler/[jeton]` | Annulation via le lien du mail | serveur |
| `/connexion` · `/auth/confirmer` | Connexion par lien magique (élèves et Mathilde) | serveur |
| `/mon-espace` | Espace élève : réservations à venir/passées, profil, suppression du compte | serveur |
| `/admin` … | Espace de gestion (voir §7) | serveur |
| `/styleguide` | Système de design (page interne de travail) | statique |
| `/api/newsletter` | Inscription Brevo | route serveur |
| `/api/taches/quotidien` · `/api/taches/recap-hebdo` | Tâches planifiées | route serveur |

---

## 6. La base de données (Supabase)

Tables (noms en français, au pluriel) :

| Table | Contenu |
|---|---|
| `lieux` | Colette Gym, Le Yoga de Priti, Work'in Tours, Inspire, La Fabrique des Possibles — avec adresse complète (elle figure dans les mails) |
| `cours` | Les **créneaux récurrents** : nom, lieu, jour, heures, capacité (12), dates de saison. Un créneau n'est **jamais modifié** une fois ses séances créées : à la rentrée, on crée de nouvelles lignes. |
| `seances` | **Une ligne par séance réelle**, générée 8 semaines à l'avance par une tâche quotidienne. Permet d'annuler une date précise ou de changer sa capacité. |
| `periodes_off` | Absences de Mathilde : aucune séance générée sur ces dates, les séances existantes sont annulées et les inscrits prévenus. |
| `workshops` | Événements ponctuels (2h30), créés au cas par cas, brouillon ou publié, avec tarif affiché (pas d'encaissement). |
| `reservations` | Une réservation = une séance **ou** un workshop. Email en minuscules, prêt de tapis, statut `confirmee`/`annulee`, jeton d'annulation unique. |
| `profils` | Comptes élèves optionnels (prénom, nom, téléphone). Pas de lien technique avec `reservations` : le rattachement se fait **par l'email**, donc les réservations faites avant la création du compte y apparaissent. |
| `admins` | Liste des comptes administrateurs. Alimentée **à la main**, personne ne peut s'y ajouter depuis le site. |
| `limites_envoi` | Anti-abus : un lien de connexion par minute et par adresse. |

Points clés :

- **La jauge est vérifiée côté serveur, dans une transaction** (fonction Postgres
  `reserver`) : deux personnes qui prennent la dernière place en même temps ne passent
  pas toutes les deux.
- **Fermeture** : une séance n'est plus réservable à son heure de début, **heure de Paris**.
- **Séance complète** : formulaire désactivé, message invitant à contacter Mathilde.
  Pas de liste d'attente.
- **Sécurité (RLS)** activée sur toutes les tables. Le public ne voit que des chiffres
  (jauges) via des vues, jamais de données personnelles.

### Données de la saison 2026-2027 (déjà en base)

| Cours | Jour | Horaire | Lieu |
|---|---|---|---|
| Hatha flow | Lundi | 19:00 – 20:15 | Colette Gym |
| Hatha flow | Mercredi | 20:15 – 21:30 | Colette Gym |
| Hatha flow | Jeudi | 08:45 – 10:00 | Colette Gym |
| Vinyasa | Mercredi | 10:30 – 11:45 | Le Yoga de Priti |
| Vinyasa | Vendredi | 18:30 – 19:45 | Colette Gym |
| Vinyasa | Samedi | 11:15 – 12:30 | Work'in Tours |

Saison du 07/09/2026 au 31/07/2027. Workshops saisis : « Yin & bain sonore » (samedis,
35 €) et « Workshop yoga » (dimanches 9h30–12h, 40 €) à la Fabrique des Possibles,
d'octobre 2026 à mai 2027, repris des dates annoncées sur le site actuel.

---

## 7. Réservation, mails et espace de gestion

### Les mails (Resend, expéditeur `reservation@yogside.com`)

| Destinataire | Quand | Contenu |
|---|---|---|
| Élève | à la réservation | cours, date, heure, **adresse complète**, rappel du tapis, règle d'annulation (informative), lien d'annulation |
| Élève | la veille (tâche quotidienne) | rappel |
| Élève | si la séance est annulée | information immédiate avec le motif |
| Élève | à la connexion | lien magique en français |
| Mathilde (`info@yogside.com`) | à chaque réservation | nom, email, téléphone, prêt de tapis, cours, jauge (« 9/12 ») |
| Mathilde | le dimanche soir | récapitulatif de la semaine suivante avec les inscrits |

### Les tâches planifiées (`vercel.json`)

| Tâche | Horaire (UTC) | Rôle |
|---|---|---|
| `/api/taches/quotidien` | tous les jours 16:00 (17h ou 18h à Paris) | génère les séances des 8 semaines suivantes + envoie les rappels du lendemain |
| `/api/taches/recap-hebdo` | dimanche 17:00 (18h ou 19h à Paris) | récapitulatif à Mathilde |

### L'espace de gestion (`/admin`)

Réservé aux comptes présents dans la table `admins`. Mathilde s'y connecte par lien
magique, comme une élève. Elle peut :

- voir le planning hebdomadaire avec les jauges et naviguer de semaine en semaine ;
- ouvrir une séance : liste des inscrits, **export CSV** (compatible Excel), modifier la
  capacité, **annuler** la séance (mail automatique aux inscrits) ;
- créer, modifier, publier, annuler un **workshop** ;
- déclarer une **période off** ;
- gérer les **créneaux** et les **lieux**, et « Préparer la saison suivante » (recopie les
  créneaux avec de nouvelles dates).

> ⚠️ **Il n'existe pas de fonction « ajouter une réservation à la main »** dans
> l'espace de gestion. Ça compte pour la bascule (voir §9.2).

---

## 8. Ce qui est déjà repris du site WordPress — et ce qui ne l'est pas

### 8.1 Déjà fait

| Élément | Où il est maintenant |
|---|---|
| Tous les textes des pages Accueil, Les cours, À propos, Événement | Sanity (import initial via `studio/scripts/`) |
| Photos du site (jusqu'à 2560 px) | Sanity (copie d'origine dans `src/assets/site-actuel/`) |
| Tarifs « à partir de septembre 2026 » | Sanity, page « Les cours » → onglet Tarifs |
| Horaires des cours | Supabase (`cours`) — affichés automatiquement |
| Lieux et adresses | Supabase (`lieux`) |
| Workshops annoncés | Supabase (`workshops`) |
| Effets (fondu, parallaxe, rotation de la pastille, soleil Lottie, carrousel, menu mobile) | `src/scripts/effets.ts` et composants |
| Formulaire newsletter « Soyez prévenu des actualités de Yogside » | code prêt, **attend les clés Brevo** |
| Logo, favicon, liens Instagram / Facebook, email de contact | Sanity (Réglages généraux) + `src/assets/marque/` |
| Domaine d'envoi des mails | Resend, `yogside.com` vérifié (DKIM, SPF via CNAME chez OVH) |

Le relevé détaillé du site actuel, page par page, est dans `docs/contenus-site-actuel.md`.

### 8.2 Volontairement non repris

- La règle « inscriptions le samedi midi pour la semaine suivante » (abandonnée : les
  réservations sont ouvertes dès que la séance existe).
- Les 3 avis « Anh Tran » identiques et le bloc Journal en lorem ipsum (masqués sur le
  site actuel).
- Les pages et articles de démonstration : `/test-page/`, `/blog/`, `/article-1/`,
  `/article-2/`, les articles « lorem ipsum ».
- La page `/boutique/` (boutique EKAM de 2022, plus d'actualité).
- Le planning de la version tablette du site actuel (ancien : Inspire, Burpees Studio).

### 8.3 Pas encore fait — à traiter avant ou pendant la bascule

| Sujet | Détail | Qui débloque |
|---|---|---|
| **Clés Brevo** | `BREVO_API_KEY` + `BREVO_LISTE_ID` de la liste existante, à mettre dans Vercel | Mathilde (accès Brevo) |
| **Flux Instagram** | « Et sur instagram » : 4 dernières publications de @yogside_fr. Non branché. Options : API officielle Instagram, ou service type Behold.so. | Mathilde (accès Instagram) |
| **Mentions légales** | Page absente. Obligatoire pour un site professionnel en France : nom, statut, SIRET, adresse ou email de contact, hébergeur (Vercel Inc.), traitement des données personnelles. **Ne pas inventer de contenu** : à demander à Mathilde. | Mathilde |
| **Redirections des anciennes URL** | Aucune n'est configurée (voir §9.4). Sans elles, les liens Google et les favoris tombent sur une page d'erreur. | Louison (Claude Code) |
| **Indexation** | `public/robots.txt` interdit tout (`Disallow: /`) et `src/layouts/Base.astro` contient `<meta name="robots" content="noindex, nofollow">`. **À retirer le jour de la bascule** (pas avant, pour ne pas faire concurrence au site actuel). Garder le `noindex` du layout `Admin.astro`. | Louison |
| **Plan du site (sitemap)** | Le nouveau site n'en a pas. Utile pour Google Search Console (intégration `@astrojs/sitemap`, en excluant `/admin`, `/mon-espace`, `/reserver`, `/annuler`, `/styleguide`). | Louison |
| **Page 404** | Pas de page d'erreur personnalisée (`src/pages/404.astro`). Recommandée. | Louison |
| **Page `/styleguide`** | Page interne de travail : à retirer ou à protéger avant la mise en ligne publique. | Louison |
| **Accès de Mathilde** | Sanity : l'inviter (sanity.io/manage → Yogside → Members, rôle Editor). Site : après sa première connexion sur `/connexion`, ajouter son identifiant dans la table `admins` (une ligne, via l'éditeur SQL de Supabase). | Louison + Mathilde |
| **Renouvellement du domaine** | yogside.com expirait le 11/10/2026 : vérifier dans OVH qu'il a bien été renouvelé (renouvellement automatique conseillé). | Mathilde |
| **Formule Vercel** | La formule gratuite (Hobby) est réservée à un usage non commercial selon les conditions de Vercel. Yogside étant une activité professionnelle, vérifier les conditions en vigueur et envisager la formule Pro. | Louison + Mathilde |

---

## 9. Le plan de bascule, étape par étape

**Principe : on prépare tout sur l'adresse de test, on vérifie, et on ne touche au DNS
qu'en dernier.** Le DNS, c'est l'annuaire qui dit « yogside.com = tel serveur ». Tant qu'il
pointe vers o2switch, les visiteurs voient le WordPress. Le jour J, on change une ligne
pour qu'il pointe vers Vercel. On garde le WordPress intact quelques semaines pour pouvoir
revenir en arrière.

### 9.1 Préparation (aucun impact sur le site actuel)

1. **Récupérer les accès manquants** auprès de Mathilde : Brevo, Instagram, infos des
   mentions légales, confirmation du renouvellement du domaine.
2. **Compléter le code** (dans Claude Code) : redirections (§9.4), page mentions légales,
   page 404, sitemap, retrait ou protection de `/styleguide`. Ne pas encore retirer le
   `noindex`.
3. **Mettre à jour les données** si le site actuel a changé depuis le relevé du
   01/10/2026 : nouveaux workshops annoncés, changement d'horaire, tarifs. Comparer
   yogside.com avec le nouveau site, page par page.
4. **Mettre les clés Brevo** dans Vercel et tester l'inscription newsletter.
5. **Donner les accès à Mathilde** (Sanity + table `admins`) et lui faire faire un tour :
   modifier un texte dans Sanity, consulter le planning, ouvrir une séance.

### 9.2 Les réservations en cours sur WordPress

C'est le point le plus délicat. Le module de réservation WordPress contient
probablement des **réservations pour des séances à venir**. Le nouveau système ne les
connaît pas : ces élèves n'apparaîtraient ni dans les jauges, ni dans la liste des
inscrits, ni dans le récap du dimanche.

Questions à poser à Mathilde, puis options :

- **Combien de réservations futures** existent dans WordPress au moment de la bascule ?
  (Elles se consultent dans l'administration WordPress, dans l'extension de réservation.)
- **Option A — repartir à zéro** : choisir une date de bascule, annoncer aux élèves
  (newsletter, Instagram, en cours) qu'à partir de cette date on réserve sur le nouveau
  site, et leur demander de re-réserver. Simple, sans manipulation de données.
- **Option B — reprendre les réservations** : exporter la liste depuis WordPress et la
  réinsérer dans Supabase. Comme l'espace de gestion n'a pas de bouton « ajouter un
  inscrit », il faudrait soit un script SQL préparé avec Claude Code (en passant par la
  fonction `reserver` pour respecter les jauges), soit ajouter cette fonction à l'espace
  de gestion. Ne pas envoyer de mail de confirmation en masse sans prévenir.
- **Conseil** : basculer **juste après** un week-end ou une période calme, quand il y a peu
  de réservations futures, et fermer les réservations côté WordPress au même moment pour
  éviter qu'une élève réserve sur l'ancien site après la bascule DNS (le temps que le
  changement se propage, certains visiteurs voient encore l'ancien site).

La **liste newsletter** n'a pas besoin d'être migrée : elle reste dans Brevo, le nouveau
site ajoute simplement les inscrits à la même liste.

### 9.3 Recette sur l'adresse de test

Avec `EMAIL_REDIRECTION` rempli (tous les mails arrivent sur une adresse de test),
dérouler **chaque** parcours sur `https://yogside.vercel.app`, sur ordinateur et sur
téléphone :

**Parcours élève**
- [ ] Le planning affiche les 4 prochaines semaines, avec les bonnes heures (heure de Paris)
- [ ] Réserver une séance sans compte → page de confirmation → mail reçu avec adresse
      du lieu et lien d'annulation
- [ ] Mail « nouvelle réservation » reçu côté professeure, avec la jauge
- [ ] Cocher « prêt de tapis » → l'info apparaît dans le mail à la professeure
- [ ] Réserver deux fois la même séance avec le même email → message « déjà inscrit »
- [ ] Remplir une séance (capacité baissée à 1 depuis l'admin) → formulaire désactivé
- [ ] Annuler via le lien du mail → la place se libère sur le planning
- [ ] Réserver un workshop depuis `/evenements`
- [ ] Se connecter par lien magique → `/mon-espace` montre les réservations faites avant
      la création du compte → modifier le profil → le formulaire est pré-rempli
- [ ] Supprimer le compte → réservations futures annulées
- [ ] S'inscrire à la newsletter → contact présent dans la liste Brevo

**Parcours Mathilde**
- [ ] Modifier un texte et une photo dans Sanity → visible sur le site en 1 à 2 minutes
- [ ] Modifier les tarifs dans Sanity
- [ ] Connexion à `/admin` → planning de la semaine avec jauges
- [ ] Ouvrir une séance → inscrits → export CSV ouvert dans Excel
- [ ] Annuler une séance → mail d'annulation reçu par l'inscrit
- [ ] Déclarer une période off → séances annulées, inscrits prévenus
- [ ] Créer un workshop en brouillon, le publier → visible sur `/evenements`

**Tâches planifiées**
- [ ] Le rappel de la veille arrive (Vercel → onglet Cron Jobs → lancer la tâche à la main
      pour tester)
- [ ] Le récap du dimanche arrive sur `info@yogside.com`

**Contenu et design**
- [ ] Chaque page comparée au site actuel : textes, photos, effets
- [ ] Liens du menu, du pied de page, Instagram, Facebook, email
- [ ] Mentions légales présentes

### 9.4 Les redirections des anciennes adresses

Le WordPress publie ces adresses (relevé du sitemap Yoast, `https://yogside.com/sitemap_index.xml`,
le 27/11/2026). Correspondances proposées, en **redirection permanente (301)** :

| Ancienne URL (WordPress) | Nouvelle URL | Remarque |
|---|---|---|
| `/` | `/` | identique |
| `/les-cours/` | `/cours` | |
| `/a-propos/` | `/a-propos` | identique, fonctionne déjà |
| `/evenement/` | `/evenements` | pluriel dans le nouveau site |
| `/reservation/` | `/planning` | la réservation part du planning |
| `/cours-individuelle/` | `/cours` | cours particuliers : renvoi vers les tarifs (« contactez-moi pour un devis ») — à valider |
| `/contact/` | `/a-propos` ou `/` | pas de page contact dans le nouveau site — à décider |
| `/cours/workshop/` | `/evenements` | ancien type de contenu « cours » |
| `/cours/cours-en-groupe/` | `/cours` | |
| `/cours/` | `/cours` | même adresse, rien à faire |
| `/boutique/` | `/` | page abandonnée |
| `/blog/`, `/article-1/`, `/article-2/`, articles « lorem ipsum », `/test-page/` | `/` | contenus de démonstration |

Mise en œuvre : option `redirects` dans `astro.config.mjs`, ou bloc `redirects` dans
`vercel.json`. À faire dans Claude Code. Après la bascule, vérifier chaque ancienne
adresse dans le navigateur.

### 9.5 Le jour J

À faire **dans cet ordre**, de préférence un matin en semaine, quand Louison est disponible
pour surveiller :

1. **La veille** : chez OVH, baisser la durée de vie (TTL) des enregistrements `@` et `www`
   de la zone DNS (par exemple 300 secondes), pour que le changement se propage vite et que
   le retour arrière soit rapide.
2. **Dans Vercel** : Settings → Domains → ajouter `yogside.com` et `www.yogside.com`
   (l'un redirige vers l'autre, au choix). Vercel affiche les valeurs DNS à utiliser.
3. **Variables d'environnement Vercel (production)** :
   - `PUBLIC_SITE_URL` = `https://yogside.com`
   - `EMAIL_REDIRECTION` = **vide**
   - vérifier que toutes les autres sont présentes (§3)
4. **Dans le code** (commit + push, Vercel redéploie) :
   - retirer le `noindex` de `src/layouts/Base.astro` ;
   - remplacer `public/robots.txt` par une version qui autorise l'indexation (en
     interdisant `/admin`, `/mon-espace`, `/reserver`, `/annuler`) et qui indique le sitemap.
5. **Sanity** : autoriser le nouveau domaine — dans `studio/` :
   `npx sanity cors add https://yogside.com` (et `https://www.yogside.com` si utilisé).
6. **WordPress** : fermer les réservations sur l'ancien site (ou afficher un message
   renvoyant vers le nouveau site), selon l'option choisie au §9.2.
7. **Chez OVH — zone DNS de yogside.com** (c'est la zone **active** ; celle visible chez
   o2switch est inactive, ne pas s'y fier) :
   - remplacer l'enregistrement **A** de `@` (actuellement `109.234.164.55`) par la valeur
     donnée par Vercel (historiquement `76.76.21.21`) ;
   - remplacer le **CNAME** de `www` par la valeur donnée par Vercel (historiquement
     `cname.vercel-dns.com`) ;
   - **ne toucher à rien d'autre**. En particulier :
     - les **MX** (réception des mails de `info@yogside.com`, hébergée chez OVH) ;
     - le **SPF** et le **DMARC** de la racine ;
     - les enregistrements **Resend** : TXT `resend._domainkey`, CNAME `rsend` et `send`.
     Les modifier couperait la boîte mail de Mathilde ou l'envoi des confirmations.
8. **Attendre la propagation** (quelques minutes à quelques heures). Vercel affiche
   « Valid Configuration » et génère le certificat HTTPS automatiquement.
9. **Vérifier** : `https://yogside.com` affiche le nouveau site, en HTTPS ; les anciennes
   URL redirigent ; une vraie réservation de test arrive bien (puis l'annuler) ; un mail
   envoyé à `info@yogside.com` depuis une autre boîte arrive toujours.

### 9.6 Plan de retour arrière

> ⚠️ **Caduc depuis le 27/11/2026** : l'hébergement o2switch expire. Plus aucun retour
> au WordPress n'est possible (voir `docs/avancement.md`). Le texte ci-dessous ne sert
> plus qu'à titre d'historique.

Si quelque chose ne va pas après le changement de DNS : chez OVH, remettre l'**A** de `@`
sur `109.234.164.55` et le CNAME `www` sur son ancienne valeur (**la noter avant de la
modifier**). Le WordPress, toujours hébergé chez o2switch, reprend la main dès la
propagation. Rouvrir les réservations WordPress si elles avaient été fermées.

### 9.7 Après la bascule

- **Semaine 1** : surveiller les journaux Vercel (onglet Logs) et les envois Resend
  (tableau de bord Resend), vérifier que le rappel quotidien et le récap du dimanche partent.
- **Google Search Console** : déclarer le domaine (validation par un enregistrement TXT
  chez OVH), soumettre le sitemap, surveiller les erreurs 404.
- **Communiquer** : newsletter et Instagram pour présenter le nouveau site et la
  réservation en ligne.
- **Archiver le WordPress** : après quelques semaines sans problème, faire une sauvegarde
  complète chez o2switch (fichiers + base de données), la conserver, puis résilier
  l'hébergement o2switch. **Ne pas résilier OVH** : il porte le domaine, le DNS et la boîte mail.
- **Former Mathilde** : un court mode d'emploi (Sanity pour les textes, `/admin` pour le
  reste) serait utile — à rédiger pour elle, sans jargon.

---

## 10. Commandes utiles

| Commande | Où | Rôle |
|---|---|---|
| `npm install` | racine | installe les dépendances du site |
| `npm run dev` | racine | site en local sur `http://localhost:4321` |
| `npm run build` | racine | construit le site comme Vercel le fera (détecte les erreurs) |
| `npm run check` | racine | vérification TypeScript |
| `npm run dev` | `studio/` | Sanity Studio en local |
| `npm run deploy` | `studio/` | publie le Studio sur yogside.sanity.studio |
| `npm run import` | `studio/` | réimporte les contenus initiaux — **écrase les fiches**, ne pas relancer une fois que Mathilde a modifié ses textes |
| `npx supabase db push` | racine | applique les migrations SQL au projet Supabase en ligne |

Le site se déploie tout seul : chaque `git push` sur `main` déclenche un déploiement Vercel.

---

## 11. Règles à ne jamais enfreindre

Décidées avec la cliente, elles s'appliquent pendant et après la bascule :

- Ne pas toucher au WordPress ni au DNS avant validation complète (§9.3).
- **Pas de paiement en ligne.** Les tarifs sont affichés, le règlement se fait en direct.
- **Pas de suivi d'abonnement ni de décompte de séances** : Mathilde gère ça avec ses élèves.
- **Le compte élève reste optionnel** : on doit toujours pouvoir réserver sans compte.
- **Pas de liste d'attente.**
- **Pas de contrôle automatique** de la règle des 6 heures ni du rattrapage sous deux
  semaines : affichés à titre informatif seulement.
- Les cours et les jauges ne vont **jamais** dans Sanity.
- Un créneau (`cours`) n'est jamais modifié une fois ses séances générées : nouvelle
  saison = nouvelles lignes.
- La clé de service Supabase ne sort jamais du serveur.
- Les données personnelles restent minimales (nom, email, téléphone) ; la suppression
  d'un compte efface le profil et anonymise les réservations.

---

## 12. Glossaire pour un profil Webflow

| Terme | Ce que c'est | Équivalent Webflow |
|---|---|---|
| **Astro** | Le générateur du site : des fichiers `.astro` (HTML + un peu de code en haut) qui deviennent des pages | Le Designer, mais en code |
| **Composant** | Un bloc réutilisable (`EnTete.astro`, `Jauge.astro`) | Un Component |
| **Layout** | Le gabarit commun à plusieurs pages (en-tête, pied de page) | Un Component « page wrapper » |
| **Sanity** | Le CMS où Mathilde écrit ses textes | Le CMS / l'Editor |
| **Schéma Sanity** | La liste des champs de chaque fiche | Les champs d'une Collection |
| **Supabase** | Une base de données Postgres + gestion des comptes | Pas d'équivalent (Webflow Memberships et Logic, en bien plus solide) |
| **RLS** (Row Level Security) | Règles dans la base qui disent qui peut lire ou écrire chaque ligne | Les permissions, mais au niveau de chaque donnée |
| **Migration** | Un fichier SQL qui décrit une modification de la base, appliqué une fois | Un historique de modifications du schéma CMS |
| **Route serveur** | Du code qui s'exécute chez Vercel, pas dans le navigateur (là où vivent les clés secrètes) | Pas d'équivalent ; proche d'une Logic ou d'un webhook |
| **Variable d'environnement** | Un réglage secret ou propre à l'environnement, hors du code | Les clés d'API dans les Integrations |
| **Cron** | Une tâche lancée automatiquement à heure fixe | Une automatisation Zapier planifiée |
| **DNS / enregistrement A / CNAME** | L'annuaire qui relie le nom de domaine au serveur | Ce que Webflow fait poser dans « Publishing → Custom domain » |
| **Redirection 301** | « Cette page a déménagé définitivement ici » | Les 301 redirects de Webflow |
| **Lien magique** | Connexion par un lien reçu par mail, sans mot de passe | — |

---

## 13. Pour démarrer une conversation avec l'assistant

Exemple de premier message à coller avec ce document :

> Voici le guide de mon projet Yogside. Je veux remplacer le site WordPress actuel par
> le nouveau site, sans couper l'activité de Mathilde. Aide-moi à organiser la bascule
> (§9) : commence par la liste des questions à poser à Mathilde et des accès à récupérer,
> puis on passera à la recette et au jour J. Je fais les modifications de code avec
> Claude Code : quand il en faut une, décris-la-moi précisément pour que je la lui transmette.
