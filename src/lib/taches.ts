// Tâches planifiées et envois groupés — code serveur uniquement.
import { supabaseService } from './supabase';
import {
  envoyerTous,
  mailAnnulationSeance,
  mailRappel,
  mailRecapHebdo,
  type Inscrit,
  type Seance,
  type SeanceRecap,
} from './emails';

const COLONNES_LIEU = 'nom, adresse, code_postal, ville';
const COLONNES_INSCRIT = 'prenom, nom, email, telephone, pret_tapis, message, statut';

/** Date du jour à Paris, décalée de `jours` : "2026-10-02" */
export function dateParis(jours = 0) {
  const d = new Date(Date.now() + jours * 864e5);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d);
}

/** Crée les séances des 8 prochaines semaines (idempotent) */
export async function genererSeances() {
  const { data, error } = await supabaseService().rpc('generer_seances');
  if (error) throw error;
  return data as number;
}

/** Rappel aux inscrits des séances et workshops du lendemain, une seule fois */
export async function envoyerRappels() {
  const db = supabaseService();
  const demain = dateParis(1);

  const [seances, workshops] = await Promise.all([
    db
      .from('reservations')
      .select(`id, prenom, email, jeton, seance:seances!inner(date, annulee, cours:cours(nom, heure_debut, heure_fin, lieu:lieux(${COLONNES_LIEU})))`)
      .eq('statut', 'confirmee')
      .is('rappel_envoye_le', null)
      .eq('seance.date', demain)
      .eq('seance.annulee', false),
    db
      .from('reservations')
      .select(`id, prenom, email, jeton, workshop:workshops!inner(titre, date, heure_debut, heure_fin, annule, lieu:lieux(${COLONNES_LIEU}))`)
      .eq('statut', 'confirmee')
      .is('rappel_envoye_le', null)
      .eq('workshop.date', demain)
      .eq('workshop.annule', false),
  ]);
  if (seances.error) throw seances.error;
  if (workshops.error) throw workshops.error;

  // Forme imbriquée renvoyée par PostgREST
  const aEnvoyer = [
    ...(seances.data as any[]).map((r) => ({
      r,
      s: { titre: r.seance.cours.nom, date: r.seance.date, heure_debut: r.seance.cours.heure_debut, heure_fin: r.seance.cours.heure_fin, lieu: r.seance.cours.lieu },
    })),
    ...(workshops.data as any[]).map((r) => ({
      r,
      s: { titre: r.workshop.titre, date: r.workshop.date, heure_debut: r.workshop.heure_debut, heure_fin: r.workshop.heure_fin, lieu: r.workshop.lieu },
    })),
  ].filter(({ r }) => r.email);

  let envoyes = 0;
  for (const { r, s } of aEnvoyer) {
    const mail = mailRappel(s as Seance, { prenom: r.prenom, jeton: r.jeton });
    if (await envoyerTous([{ a: r.email, ...mail, repondreA: import.meta.env.EMAIL_PROF }])) {
      await db.from('reservations').update({ rappel_envoye_le: new Date().toISOString() }).eq('id', r.id);
      envoyes += 1;
    }
  }
  return { a_envoyer: aEnvoyer.length, envoyes };
}

/** Récapitulatif de la semaine suivante (lundi → dimanche) envoyé à la professeure */
export async function envoyerRecapHebdo() {
  const db = supabaseService();
  // Envoyé le dimanche : la semaine commence le lendemain
  const debut = dateParis(1);
  const fin = dateParis(7);

  const [seances, workshops] = await Promise.all([
    db
      .from('seances')
      .select(`date, annulee, capacite, cours:cours(nom, heure_debut, heure_fin, lieu:lieux(${COLONNES_LIEU})), reservations(${COLONNES_INSCRIT})`)
      .gte('date', debut)
      .lte('date', fin),
    db
      .from('workshops')
      .select(`titre, date, heure_debut, heure_fin, annule, capacite, publie, lieu:lieux(${COLONNES_LIEU}), reservations(${COLONNES_INSCRIT})`)
      .gte('date', debut)
      .lte('date', fin)
      .eq('publie', true),
  ]);
  if (seances.error) throw seances.error;
  if (workshops.error) throw workshops.error;

  const confirmes = (liste: (Inscrit & { statut: string })[]) =>
    liste.filter((i) => i.statut === 'confirmee').sort((a, b) => (a.prenom ?? '').localeCompare(b.prenom ?? ''));

  const toutes: SeanceRecap[] = [
    ...(seances.data as any[]).map((s) => ({
      titre: s.cours.nom,
      date: s.date,
      heure_debut: s.cours.heure_debut,
      heure_fin: s.cours.heure_fin,
      lieu: s.cours.lieu,
      annulee: s.annulee,
      capacite: s.capacite,
      inscrits: confirmes(s.reservations),
    })),
    ...(workshops.data as any[]).map((w) => ({
      titre: w.titre,
      date: w.date,
      heure_debut: w.heure_debut,
      heure_fin: w.heure_fin,
      lieu: w.lieu,
      annulee: w.annule,
      capacite: w.capacite,
      inscrits: confirmes(w.reservations),
    })),
  ].sort((a, b) => (a.date + a.heure_debut).localeCompare(b.date + b.heure_debut));

  const mail = mailRecapHebdo(debut, toutes);
  await envoyerTous([{ a: import.meta.env.EMAIL_PROF ?? 'info@yogside.com', ...mail }]);
  return { seances: toutes.length };
}

/**
 * Prévient les inscrits d'une séance annulée (annuler_seance, annuler_workshop
 * ou creer_periode_off renvoient les réservations concernées).
 * Utilisé par l'espace de gestion.
 */
export async function envoyerAnnulations(
  reservations: { prenom: string | null; email: string | null }[],
  seance: Seance,
  motif: string | null,
) {
  const mails = reservations
    .filter((r) => r.email)
    .map((r) => ({ a: r.email!, ...mailAnnulationSeance(seance, r, motif), repondreA: import.meta.env.EMAIL_PROF }));
  return envoyerTous(mails);
}
