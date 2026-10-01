// Réservation et annulation : code serveur uniquement (clé de service).
import { supabaseService } from './supabase';

/** Codes d'erreur de la fonction Postgres reserver() → messages pour l'élève */
export const messagesErreur: Record<string, string> = {
  complet: 'Cette séance est complète. N’hésitez pas à me contacter directement.',
  deja_inscrit: 'Vous êtes déjà inscrit·e à cette séance avec cette adresse email.',
  commencee: 'Cette séance a déjà commencé, il n’est plus possible de réserver.',
  annulee: 'Cette séance est annulée.',
  introuvable: 'Cette séance n’existe pas ou plus.',
  donnees_invalides: 'Merci de vérifier vos informations : prénom, nom, email et téléphone sont obligatoires.',
  cible_invalide: 'Réservation impossible.',
};

const ERREUR_GENERIQUE = 'Un problème technique a empêché la réservation. Réessayez dans un instant ou contactez-moi.';

export type Formulaire = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  pretTapis: boolean;
  message: string;
};

export function lireFormulaire(donnees: FormData): Formulaire {
  const texte = (cle: string, max: number) => String(donnees.get(cle) ?? '').trim().slice(0, max);
  return {
    prenom: texte('prenom', 80),
    nom: texte('nom', 80),
    email: texte('email', 200).toLowerCase(),
    telephone: texte('telephone', 30),
    pretTapis: donnees.get('pret_tapis') === 'on',
    message: texte('message', 1000),
  };
}

export async function reserver(cible: { seanceId?: string; workshopId?: string }, f: Formulaire) {
  const { data, error } = await supabaseService().rpc('reserver', {
    p_seance_id: cible.seanceId ?? null,
    p_workshop_id: cible.workshopId ?? null,
    p_prenom: f.prenom,
    p_nom: f.nom,
    p_email: f.email,
    p_telephone: f.telephone,
    p_pret_tapis: f.pretTapis,
    p_message: f.message || null,
  });

  if (error) {
    const message = messagesErreur[error.message];
    if (!message) console.error('Réservation : erreur inattendue', error);
    return { ok: false as const, code: error.message, message: message ?? ERREUR_GENERIQUE };
  }
  const ligne = (data as { reservation_id: string; jeton: string; inscrits: number; capacite: number }[])[0];
  return { ok: true as const, ...ligne };
}

export type DetailReservation = {
  id: string;
  prenom: string | null;
  statut: 'confirmee' | 'annulee';
  pret_tapis: boolean;
  jeton: string;
  titre: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  annulee_seance: boolean;
  lieu: { nom: string; adresse: string; code_postal: string; ville: string };
};

/** Réservation avec sa séance (ou son workshop) et son lieu, par id ou par jeton */
export async function detailReservation(par: { id?: string; jeton?: string }): Promise<DetailReservation | null> {
  const requete = supabaseService()
    .from('reservations')
    .select(
      `id, prenom, statut, pret_tapis, jeton,
       seance:seances(date, annulee, cours:cours(nom, heure_debut, heure_fin, lieu:lieux(nom, adresse, code_postal, ville))),
       workshop:workshops(titre, date, heure_debut, heure_fin, annule, lieu:lieux(nom, adresse, code_postal, ville))`,
    );
  const { data } = await (par.id ? requete.eq('id', par.id) : requete.eq('jeton', par.jeton!)).maybeSingle();
  if (!data) return null;

  // Forme imbriquée renvoyée par PostgREST
  const r = data as any;
  const base = { id: r.id, prenom: r.prenom, statut: r.statut, pret_tapis: r.pret_tapis, jeton: r.jeton };
  if (r.seance) {
    return {
      ...base,
      titre: r.seance.cours.nom,
      date: r.seance.date,
      heure_debut: r.seance.cours.heure_debut,
      heure_fin: r.seance.cours.heure_fin,
      annulee_seance: r.seance.annulee,
      lieu: r.seance.cours.lieu,
    };
  }
  return {
    ...base,
    titre: r.workshop.titre,
    date: r.workshop.date,
    heure_debut: r.workshop.heure_debut,
    heure_fin: r.workshop.heure_fin,
    annulee_seance: r.workshop.annule,
    lieu: r.workshop.lieu,
  };
}

export async function annulerParJeton(jeton: string) {
  const { error } = await supabaseService().rpc('annuler_par_jeton', { p_jeton: jeton });
  return !error;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
