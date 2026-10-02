// Emails transactionnels (Resend) — code serveur uniquement.
// Sur le site de test, EMAIL_REDIRECTION renvoie tous les mails vers une seule
// adresse, pour ne jamais écrire à une vraie élève par erreur.
import { Resend } from 'resend';
import { dateComplete, dateLongue, heureCourte, lienCarte } from './format';
import type { TextesReservation } from './sanity';

const env = import.meta.env;

/** Valeur d'environnement sans guillemets parasites (copiés depuis un .env) */
const sansGuillemets = (v: string | undefined) => v?.trim().replace(/^(["'])(.*)\1$/, '$2');
const SITE = (env.PUBLIC_SITE_URL ?? 'https://yogside.vercel.app').replace(/\/$/, '');

// --- Envoi ---

type Mail = { a: string; objet: string; html: string; texte: string; repondreA?: string };

export async function envoyer({ a, objet, html, texte, repondreA }: Mail) {
  const redirection = sansGuillemets(env.EMAIL_REDIRECTION);
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: sansGuillemets(env.EMAIL_EXPEDITEUR) || 'Yogside <onboarding@resend.dev>',
    to: [redirection || a],
    subject: redirection ? `[test → ${a}] ${objet}` : objet,
    html,
    text: texte,
    replyTo: repondreA,
  });
  if (error) {
    console.error(`Email « ${objet} » vers ${a} : échec`, error);
    return false;
  }
  return true;
}

/** Plusieurs envois en parallèle : un échec n'empêche pas les autres */
export async function envoyerTous(mails: Mail[]) {
  const resultats = await Promise.allSettled(mails.map(envoyer));
  return resultats.filter((r) => r.status === 'fulfilled' && r.value).length;
}

// --- Mise en forme ---

/** Échappe les valeurs saisies par les élèves avant de les insérer dans le HTML */
export function echapper(valeur: string | null | undefined) {
  return (valeur ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const COULEURS = { texte: '#1f1f1f', doux: '#5c5c5c', filet: '#e6e6e3', fond: '#f6f6f4', or: '#cfb762' };

function gabarit(titre: string, corps: string) {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${echapper(titre)}</title></head>
<body style="margin:0;padding:0;background:${COULEURS.fond};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COULEURS.fond};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;">
        <tr><td style="padding:32px 32px 8px;">
          <a href="${SITE}"><img src="${SITE}/email/logo-yogside.png" width="128" height="42" alt="Yogside" style="display:block;border:0;"></a>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:${COULEURS.texte};">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:500;line-height:1.25;">${echapper(titre)}</h1>
          ${corps}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid ${COULEURS.filet};font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${COULEURS.doux};">
          Yogside · cours de yoga à Tours · <a href="${SITE}" style="color:${COULEURS.doux};">${SITE.replace('https://', '')}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const p = (html: string, style = '') => `<p style="margin:0 0 16px;${style}">${html}</p>`;
const petit = (html: string) => p(html, `font-size:13px;color:${COULEURS.doux};`);
const bouton = (href: string, libelle: string) =>
  `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;padding:12px 24px;background:#090909;color:#ffffff;text-decoration:none;font-weight:500;">${libelle}</a></p>`;

export type Seance = {
  titre: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  lieu: { nom: string; adresse: string; code_postal: string; ville: string };
};

function recap(s: Seance) {
  const adresse = `${s.lieu.adresse}, ${s.lieu.code_postal} ${s.lieu.ville}`;
  const ligne = (libelle: string, valeur: string) =>
    `<tr><td style="padding:4px 16px 4px 0;color:${COULEURS.doux};vertical-align:top;">${libelle}</td><td style="padding:4px 0;font-weight:500;">${valeur}</td></tr>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;padding:16px;background:${COULEURS.fond};">
    ${ligne('Cours', echapper(s.titre))}
    ${ligne('Date', majuscule(dateComplete(s.date)))}
    ${ligne('Horaire', `${heureCourte(s.heure_debut)} – ${heureCourte(s.heure_fin)}`)}
    ${ligne('Lieu', `${echapper(s.lieu.nom)}<br><a href="${lienCarte(s.lieu.adresse, s.lieu.code_postal, s.lieu.ville)}" style="color:${COULEURS.doux};font-weight:400;">${echapper(adresse)}</a>`)}
  </table>`;
}

function recapTexte(s: Seance) {
  return [
    `Cours : ${s.titre}`,
    `Date : ${majuscule(dateComplete(s.date))}`,
    `Horaire : ${heureCourte(s.heure_debut)} – ${heureCourte(s.heure_fin)}`,
    `Lieu : ${s.lieu.nom}, ${s.lieu.adresse}, ${s.lieu.code_postal} ${s.lieu.ville}`,
  ].join('\n');
}

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const lienAnnulation = (jeton: string) => `${SITE}/annuler/${jeton}`;

// --- Modèles ---

/** À l'élève, juste après la réservation */
export function mailConfirmation(s: Seance, eleve: { prenom: string; pretTapis: boolean; jeton: string }, textes: TextesReservation) {
  const objet = `Réservation confirmée — ${s.titre}, ${dateLongue(s.date)} à ${heureCourte(s.heure_debut)}`;
  const tapis = eleve.pretTapis ? 'C’est noté : un tapis vous sera prêté.' : textes.rappel;
  return {
    objet,
    html: gabarit(`Merci ${eleve.prenom}, c’est réservé !`, [
      recap(s),
      p(echapper(tapis)),
      petit(echapper(textes.annulation)),
      p('Un empêchement ? Merci de libérer votre place :'),
      bouton(lienAnnulation(eleve.jeton), 'Annuler ma réservation'),
      p('À très vite sur le tapis,<br>Mathilde'),
    ].join('')),
    texte: [
      `Merci ${eleve.prenom}, c’est réservé !`,
      '',
      recapTexte(s),
      '',
      tapis,
      textes.annulation,
      '',
      `Annuler ma réservation : ${lienAnnulation(eleve.jeton)}`,
      '',
      'À très vite sur le tapis,',
      'Mathilde',
    ].join('\n'),
  };
}

/** Lien de connexion (élèves et professeure), valable une heure */
export function mailConnexion(lien: string) {
  return {
    objet: 'Votre lien de connexion Yogside',
    html: gabarit('Votre lien de connexion', [
      p('Cliquez sur le bouton ci-dessous pour accéder à votre espace Yogside :'),
      bouton(lien, 'Me connecter'),
      petit('Ce lien est valable une heure et ne fonctionne qu’une seule fois. Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce message.'),
    ].join('')),
    texte: [
      'Votre lien de connexion Yogside :',
      lien,
      '',
      'Ce lien est valable une heure et ne fonctionne qu’une seule fois.',
      'Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce message.',
    ].join('\n'),
  };
}

/** À l'élève, la veille */
export function mailRappel(s: Seance, eleve: { prenom: string | null; jeton: string }, textes: TextesReservation) {
  return {
    objet: `Rappel — ${s.titre} demain à ${heureCourte(s.heure_debut)}`,
    html: gabarit(`À demain${eleve.prenom ? ` ${eleve.prenom}` : ''} !`, [
      p('Petit rappel pour votre séance :'),
      recap(s),
      p(echapper(textes.rappel)),
      petit(`Un empêchement ? <a href="${lienAnnulation(eleve.jeton)}" style="color:${COULEURS.doux};">Annuler ma réservation</a>`),
    ].join('')),
    texte: [
      `À demain${eleve.prenom ? ` ${eleve.prenom}` : ''} !`,
      '',
      recapTexte(s),
      '',
      textes.rappel,
      `Un empêchement ? ${lienAnnulation(eleve.jeton)}`,
    ].join('\n'),
  };
}

/** À l'élève, quand la professeure annule la séance */
export function mailAnnulationSeance(s: Seance, eleve: { prenom: string | null }, motif: string | null) {
  return {
    objet: `Séance annulée — ${s.titre}, ${dateLongue(s.date)}`,
    html: gabarit('Votre séance est annulée', [
      p(`Bonjour${eleve.prenom ? ` ${echapper(eleve.prenom)}` : ''},`),
      p('Je suis désolée, la séance suivante n’aura pas lieu :'),
      recap(s),
      motif ? p(`<strong>Motif :</strong> ${echapper(motif)}`) : '',
      p('Vous n’avez rien à faire, votre réservation est annulée.'),
      bouton(`${SITE}/planning`, 'Voir les autres séances'),
      p('Mathilde'),
    ].join('')),
    texte: [
      'Votre séance est annulée',
      '',
      recapTexte(s),
      motif ? `Motif : ${motif}` : '',
      '',
      `Voir les autres séances : ${SITE}/planning`,
      'Mathilde',
    ].join('\n'),
  };
}

export type Inscrit = {
  prenom: string | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  pret_tapis: boolean;
  message: string | null;
};

/** À la professeure, à chaque réservation */
export function mailNouvelleReservation(s: Seance, eleve: Inscrit, jauge: { inscrits: number; capacite: number }) {
  const nom = `${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim();
  const lignes = [
    ['Élève', echapper(nom)],
    ['Email', `<a href="mailto:${echapper(eleve.email)}">${echapper(eleve.email)}</a>`],
    ['Téléphone', `<a href="tel:${echapper(eleve.telephone)}">${echapper(eleve.telephone)}</a>`],
    ['Prêt de tapis', eleve.pret_tapis ? '<strong>Oui</strong>' : 'Non'],
    ...(eleve.message ? [['Message', echapper(eleve.message)]] : []),
  ];
  return {
    objet: `${nom} — ${s.titre} ${dateLongue(s.date)} (${jauge.inscrits}/${jauge.capacite})`,
    html: gabarit(`Nouvelle réservation · ${jauge.inscrits}/${jauge.capacite}`, [
      recap(s),
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${lignes
        .map(([l, v]) => `<tr><td style="padding:4px 16px 4px 0;color:${COULEURS.doux};vertical-align:top;">${l}</td><td style="padding:4px 0;">${v}</td></tr>`)
        .join('')}</table>`,
    ].join('')),
    texte: [
      `Nouvelle réservation · ${jauge.inscrits}/${jauge.capacite}`,
      '',
      recapTexte(s),
      '',
      `Élève : ${nom}`,
      `Email : ${eleve.email}`,
      `Téléphone : ${eleve.telephone}`,
      `Prêt de tapis : ${eleve.pret_tapis ? 'oui' : 'non'}`,
      eleve.message ? `Message : ${eleve.message}` : '',
    ].join('\n'),
  };
}

export type SeanceRecap = Seance & { annulee: boolean; capacite: number; inscrits: Inscrit[] };

/** À la professeure, le dimanche soir : la semaine à venir, cours par cours */
export function mailRecapHebdo(debutSemaine: string, seances: SeanceRecap[]) {
  const total = seances.reduce((n, s) => n + (s.annulee ? 0 : s.inscrits.length), 0);
  const blocs = seances.map((s) => {
    const entete = `<h2 style="margin:24px 0 4px;font-size:17px;font-weight:500;">${majuscule(dateLongue(s.date))} · ${heureCourte(s.heure_debut)} · ${echapper(s.titre)}</h2>
      <p style="margin:0 0 8px;font-size:13px;color:${COULEURS.doux};">${echapper(s.lieu.nom)} — ${s.annulee ? '<strong>annulée</strong>' : `${s.inscrits.length}/${s.capacite} inscrit${s.inscrits.length > 1 ? 's' : ''}`}</p>`;
    if (s.annulee || s.inscrits.length === 0) return entete + (s.annulee ? '' : petit('Personne pour l’instant.'));
    const liste = s.inscrits
      .map(
        (i) =>
          `<li style="margin:0 0 4px;">${echapper(`${i.prenom ?? ''} ${i.nom ?? ''}`.trim())}${i.pret_tapis ? ' · <strong>tapis</strong>' : ''}${i.telephone ? ` · <span style="color:${COULEURS.doux};">${echapper(i.telephone)}</span>` : ''}</li>`,
      )
      .join('');
    return `${entete}<ul style="margin:0;padding-left:20px;">${liste}</ul>`;
  });

  return {
    objet: `Ta semaine du ${dateLongue(debutSemaine)} — ${total} inscription${total > 1 ? 's' : ''}`,
    html: gabarit(`La semaine à venir`, [
      p(`${seances.length} séance${seances.length > 1 ? 's' : ''} au programme, ${total} inscription${total > 1 ? 's' : ''} au total.`),
      blocs.join('') || p('Aucune séance programmée cette semaine.'),
    ].join('')),
    texte: [
      'La semaine à venir',
      '',
      ...seances.map((s) =>
        [
          `${majuscule(dateLongue(s.date))} ${heureCourte(s.heure_debut)} — ${s.titre} (${s.lieu.nom}) ${s.annulee ? 'ANNULÉE' : `${s.inscrits.length}/${s.capacite}`}`,
          ...s.inscrits.map((i) => `  - ${`${i.prenom ?? ''} ${i.nom ?? ''}`.trim()}${i.pret_tapis ? ' (tapis)' : ''}`),
        ].join('\n'),
      ),
    ].join('\n'),
  };
}
