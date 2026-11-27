# Yogside — Avancement

Journal de bord du projet, mis à jour à la fin de chaque session de travail, avant le
dernier commit. Le contexte complet et le plan de bascule sont dans
[`guide-projet-et-bascule.md`](guide-projet-et-bascule.md) (les numéros § y renvoient).

> **Aucune clé, aucun mot de passe, aucun jeton dans ce fichier.**
> On peut citer le nom d'une variable (`BREVO_API_KEY`), jamais sa valeur.

---

## Fait

Le plus récent en haut. Une ligne par changement, avec les fichiers concernés.

### 2026-11-27
- Branche `bascule` fusionnée dans `main` (PR #1) : site public indexable, déploiement Vercel vérifié (`robots.txt`, absence de `noindex`, `/admin` toujours protégé) — `src/layouts/Base.astro`, `public/robots.txt`
- **Décisions de bascule** : l'hébergement o2switch du WordPress expire → bascule accélérée, mise en ligne sur yogside.com aujourd'hui. Option A pour les réservations WordPress : pas d'import, les 8 réservations restantes (ce soir et demain) ont été transmises à Mathilde. Base WordPress sauvegardée. **Plus de retour arrière possible vers le WordPress** (le §9.6 du guide ne s'applique plus).
- Branche `bascule` poussée, **non fusionnée** : `noindex` retiré du site public (gardé dans l'admin), `robots.txt` ouvert sauf `/admin`, `/mon-espace`, `/reserver`, `/annuler`, `/connexion`, `/auth` — `src/layouts/Base.astro`, `public/robots.txt`. À fusionner par Louison au moment de la bascule.
- Redirections 301 des anciennes adresses WordPress, avec et sans slash final (34 règles) ; `/cours` et `/a-propos` non redirigées — `vercel.json`
- Page 404 (titre, phrase, liens vers l'accueil et le planning) — `src/pages/404.astro`
- Page `/styleguide` supprimée (aucun lien n'y menait) — `src/pages/styleguide.astro`
- Journal d'avancement créé ; règle de mise à jour ajoutée au CLAUDE.md — `docs/avancement.md`, `CLAUDE.md`, `docs/guide-projet-et-bascule.md`
- Guide du projet et plan de bascule WordPress → nouveau site, pour se faire aider par Claude chat — `docs/guide-projet-et-bascule.md`

### 2026-10-02
- Pages branchées sur Sanity (textes, photos, tarifs, réglages), cache Vercel d'une minute, import des contenus du site actuel — `src/lib/sanity.ts`, `src/components/PhotoSanity.astro`, `src/components/TexteSanity.astro`, `src/pages/*.astro`, `studio/scripts/import-contenus.ts`, `studio/scripts/contenus-initiaux.ts`
- Studio Sanity : une fiche par page (Accueil, Les cours, À propos, Événements, Réglages généraux), en français, sans création ni suppression — `studio/sanity.config.ts`, `studio/schemas/pages.ts`, `studio/schemas/communs.ts`

### 2026-10-01
- Espace de gestion : suppression d'un lieu inutilisé — `src/pages/admin/creneaux.astro`
- Espace de gestion : planning de la semaine, inscrits et export CSV, workshops, périodes off, créneaux et lieux — `src/pages/admin/**`, `src/layouts/Admin.astro`, `src/lib/admin.ts`, `src/components/admin/*`
- Expéditeur des mails : `reservation@yogside.com` (domaine vérifié chez Resend) — `.env.example`
- Connexion : messages d'erreur clairs, variables d'environnement tolérantes — `src/lib/auth.ts`, `src/pages/connexion.astro`
- Espace élève : connexion par lien magique, réservations, profil, suppression du compte — `src/lib/auth.ts`, `src/pages/connexion.astro`, `src/pages/auth/confirmer.astro`, `src/pages/mon-espace.astro`, `supabase/migrations/20261002100000_limites_envoi.sql`
- Mails Resend (confirmation, rappel, annulation, avis à la professeure, récap du dimanche) et tâches planifiées — `src/lib/emails.ts`, `src/lib/taches.ts`, `src/pages/api/taches/*`, `vercel.json`, `supabase/migrations/20261002090000_rappels.sql`
- Pages du site : accueil, cours, à propos, événements, planning, réservation, annulation, effets — `src/pages/*.astro`, `src/components/*`, `src/scripts/effets.ts`
- Tarifs de septembre 2026 et newsletter Brevo conservée — `CLAUDE.md`, `docs/specs.md`, `docs/contenus-site-actuel.md`, `src/pages/api/newsletter.ts`
- Données de la saison 2026-2027 (lieux, créneaux, workshops) et relevé des contenus du site actuel — `supabase/migrations/20261001180000_donnees_saison_2026_2027.sql`, `docs/contenus-site-actuel.md`, `src/assets/site-actuel/*`
- Système de design et page `/styleguide` — `src/styles/*`, `src/pages/styleguide.astro`, `src/components/Bouton.astro`
- Schéma Supabase : tables, jauges, réservation transactionnelle, RLS — `supabase/migrations/20261001150000_schema_initial.sql`, `supabase/migrations/20261001160000_reserver_deja_inscrit_avant_complet.sql`
- Initialisation d'Astro avec l'adaptateur Vercel, site non indexé — `astro.config.mjs`, `public/robots.txt`, `package.json`
- Modèle de variables d'environnement — `.env.example`
- Cadrage : CLAUDE.md, spécifications, décisions d'octobre 2026 — `CLAUDE.md`, `docs/specs.md`

---

## Reste à faire

Checklist de bascule (§9 du guide). Cocher au fur et à mesure.

### Préparation — §9.1 (sans impact sur le site actuel)
- [ ] Récupérer auprès de Mathilde : accès Brevo, accès Instagram, informations des mentions légales, confirmation du renouvellement du domaine
- [x] Redirections des anciennes adresses WordPress (§9.4) — 27/11, vérifiées sur yogside.vercel.app
- [ ] Page mentions légales
- [x] Page 404 (`src/pages/404.astro`) — 27/11
- [ ] Plan du site (sitemap), sans `/admin`, `/mon-espace`, `/reserver`, `/annuler`, `/connexion`, `/auth`
- [x] Retirer ou protéger `/styleguide` — supprimée le 27/11
- [ ] Brancher le flux Instagram @yogside_fr
- [ ] Comparer yogside.com et le nouveau site page par page ; mettre à jour workshops, horaires et tarifs si besoin
- [ ] Mettre `BREVO_API_KEY` et `BREVO_LISTE_ID` dans Vercel, tester l'inscription newsletter
- [ ] Inviter Mathilde dans Sanity (rôle Editor)
- [ ] Après sa première connexion, ajouter Mathilde dans la table `admins`
- [ ] Faire faire un tour à Mathilde : un texte modifié dans Sanity, le planning et une séance dans `/admin`

### Réservations en cours sur WordPress — §9.2
- [x] Compter avec Mathilde les réservations futures dans WordPress — 8 réservations (27 et 28/11), transmises à Mathilde
- [x] Choisir : élèves qui réservent de nouveau (option A) ou reprise des réservations (option B) — **option A**, décidée le 27/11
- [x] ~~Si option B : script d'import ou bouton « ajouter un inscrit » dans `/admin`~~ — sans objet (option A)
- [x] Choisir la date de bascule — 27/11/2026, accélérée par l'expiration d'o2switch
- [ ] Prévenir les élèves qu'on réserve désormais sur le nouveau site (newsletter, Instagram, en cours)

### Recette sur yogside.vercel.app — §9.3 (avec `EMAIL_REDIRECTION` rempli)

**Parcours élève**
- [ ] Le planning affiche les 4 prochaines semaines, avec les bonnes heures (heure de Paris)
- [ ] Réservation sans compte → page de confirmation → mail avec adresse du lieu et lien d'annulation
- [ ] Mail « nouvelle réservation » reçu par la professeure, avec la jauge
- [ ] Prêt de tapis coché → visible dans le mail à la professeure
- [ ] Double réservation avec le même email → message « déjà inscrit »
- [ ] Séance pleine (capacité à 1 depuis l'admin) → formulaire désactivé
- [ ] Annulation par le lien du mail → place libérée sur le planning
- [ ] Réservation d'un workshop depuis `/evenements`
- [ ] Lien magique → `/mon-espace` affiche les réservations faites avant le compte → profil modifié → formulaire pré-rempli
- [ ] Suppression du compte → réservations futures annulées
- [ ] Inscription newsletter → contact présent dans la liste Brevo

**Parcours Mathilde**
- [ ] Texte et photo modifiés dans Sanity → visibles en 1 à 2 minutes
- [ ] Tarifs modifiés dans Sanity
- [ ] Connexion à `/admin` → planning de la semaine avec jauges
- [ ] Séance ouverte → inscrits → export CSV lisible dans Excel
- [ ] Séance annulée → mail d'annulation reçu par l'inscrit
- [ ] Période off déclarée → séances annulées, inscrits prévenus
- [ ] Workshop créé en brouillon puis publié → visible sur `/evenements`

**Tâches planifiées**
- [ ] Rappel de la veille reçu (tâche lancée à la main depuis Vercel → Cron Jobs)
- [ ] Récap du dimanche reçu sur `info@yogside.com`

**Contenu et design**
- [ ] Chaque page comparée au site actuel : textes, photos, effets
- [ ] Liens du menu, du pied de page, Instagram, Facebook, email
- [ ] Mentions légales présentes

### Jour J — §9.5

> Bascule accélérée le 27/11 : pas de retour arrière possible vers le WordPress. Le TTL
> n'a pas pu être baissé la veille ; noter quand même les anciennes valeurs DNS.

- [ ] Noter les valeurs actuelles de l'A de `@` et du CNAME `www` chez OVH (baisser le TTL si c'est encore utile)
- [ ] Vercel : domaines `yogside.com` et `www.yogside.com` ajoutés
- [ ] Vercel (production) : `PUBLIC_SITE_URL` = `https://yogside.com`, `EMAIL_REDIRECTION` vide, autres variables vérifiées
- [x] Code : branche `bascule` fusionnée dans `main` le 27/11 (PR #1). Déploiement Vercel prêt, `robots.txt` ouvert en ligne, plus de `noindex` sur le site public. Ajouter la ligne `Sitemap:` au `robots.txt` quand le sitemap existera.
- [x] ~~Sanity : `npx sanity cors add https://yogside.com`~~ — inutile : le site lit Sanity uniquement côté serveur, et les images viennent du CDN Sanity, qui ne contrôle pas le CORS. À ajouter seulement si un script navigateur interroge un jour Sanity.
- [x] ~~WordPress : réservations fermées ou message vers le nouveau site~~ — sans objet : l'hébergement expire, les dernières réservations sont transmises à Mathilde
- [ ] OVH : A de `@` et CNAME `www` remplacés par les valeurs Vercel — ne toucher ni aux MX, ni au SPF ou au DMARC, ni aux enregistrements Resend
- [ ] Vercel affiche « Valid Configuration », HTTPS actif
- [ ] Vérifications : nouveau site en HTTPS, anciennes adresses redirigées, une vraie réservation reçue puis annulée, un mail reçu sur `info@yogside.com`

### Après la bascule — §9.7
- [ ] Semaine 1 : surveiller les journaux Vercel et les envois Resend ; rappel quotidien et récap du dimanche partis
- [ ] Google Search Console : domaine validé, sitemap soumis, erreurs 404 suivies
- [ ] Annonce du nouveau site (newsletter, Instagram)
- [x] Sauvegarde complète du WordPress chez o2switch — base sauvegardée le 27/11
- [x] ~~Résiliation d'o2switch~~ — sans objet : l'hébergement expire de lui-même. **Garder OVH** (domaine, DNS, boîte mail).
- [ ] Mode d'emploi court pour Mathilde (Sanity + `/admin`)

---

## Blocages / questions ouvertes

### En attente de Mathilde
- **Brevo** : `BREVO_API_KEY` et identifiant de la liste existante — la newsletter ne fonctionne pas sans eux.
- **Instagram** : accès au compte @yogside_fr pour brancher le flux (API officielle ou service type Behold.so).
- **Mentions légales** : nom, statut, SIRET, adresse ou email de contact — rien ne doit être inventé.
- **Domaine** : yogside.com expirait le 11/10/2026 — renouvellement à confirmer dans OVH.
- **Contenus** : nouveaux workshops, horaires ou tarifs annoncés depuis le relevé du 01/10/2026 ?

### À trancher par Louison
- **Recette** : la bascule a lieu aujourd'hui et le retour au WordPress est impossible. Quels parcours du §9.3 faire avant de changer le DNS ? Au minimum : une réservation complète avec les mails, une annulation, la connexion à `/admin`.
- `www.yogside.com` ou `yogside.com` comme adresse principale.
- Formule Vercel : la formule gratuite (Hobby) est réservée à un usage non commercial — passer en Pro ?
