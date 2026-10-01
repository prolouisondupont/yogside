// Outils de l'espace de gestion — code serveur uniquement.
import type { AstroGlobal } from 'astro';
import { utilisateurConnecte } from './auth';
import { envoyerAnnulations } from './taches';

/**
 * Vérifie que la visiteuse est administratrice. Renvoie le client de session
 * (toutes les écritures passent par lui, donc par le RLS), ou une redirection.
 */
export async function exigerAdmin(Astro: AstroGlobal) {
  const { supabase, utilisateur } = await utilisateurConnecte(Astro.request, Astro.cookies);
  if (!utilisateur) {
    return { refus: Astro.redirect(`/connexion?suivant=${encodeURIComponent(Astro.url.pathname + Astro.url.search)}`) } as const;
  }
  const { data: admin } = await supabase.rpc('est_admin');
  if (admin !== true) return { refus: new Response('Accès réservé.', { status: 403 }) } as const;
  return { supabase, utilisateur } as const;
}

/** "2026-10-07" → lundi de la même semaine, "2026-10-05" */
export function lundiDe(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const jour = (d.getUTCDay() + 6) % 7; // 0 = lundi
  d.setUTCDate(d.getUTCDate() - jour);
  return d.toISOString().slice(0, 10);
}

export function ajouterJours(date: string, jours: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

export const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;
export const HEURE = /^\d{2}:\d{2}$/;

/** Lecture tolérante d'un champ de formulaire */
export function champ(donnees: FormData, cle: string, max = 500) {
  return String(donnees.get(cle) ?? '').trim().slice(0, max);
}

type ResaAnnulee = { prenom: string | null; email: string | null; seance_id: string | null };

/**
 * Après annulation de séances (une séance ou une période off) : un mail par
 * inscrit, avec le récapitulatif de sa séance.
 */
export async function prevenirInscrits(
  supabase: Awaited<ReturnType<typeof utilisateurConnecte>>['supabase'],
  reservations: ResaAnnulee[],
  motif: string | null,
) {
  const parSeance = new Map<string, ResaAnnulee[]>();
  for (const r of reservations) {
    if (!r.seance_id) continue;
    parSeance.set(r.seance_id, [...(parSeance.get(r.seance_id) ?? []), r]);
  }
  if (parSeance.size === 0) return 0;

  const { data } = await supabase
    .from('seances')
    .select('id, date, cours:cours(nom, heure_debut, heure_fin, lieu:lieux(nom, adresse, code_postal, ville))')
    .in('id', [...parSeance.keys()]);

  let envoyes = 0;
  // Forme imbriquée renvoyée par PostgREST
  for (const s of (data ?? []) as any[]) {
    const seance = { titre: s.cours.nom, date: s.date, heure_debut: s.cours.heure_debut, heure_fin: s.cours.heure_fin, lieu: s.cours.lieu };
    envoyes += await envoyerAnnulations(parSeance.get(s.id) ?? [], seance, motif);
  }
  return envoyes;
}

/** Valide les champs du formulaire de workshop ; renvoie les valeurs ou un message d'erreur */
export function lireWorkshop(donnees: FormData) {
  const valeurs = {
    titre: champ(donnees, 'titre', 120),
    description: champ(donnees, 'description', 2000) || null,
    lieu_id: champ(donnees, 'lieu_id', 40),
    date: champ(donnees, 'date', 10),
    heure_debut: champ(donnees, 'heure_debut', 5),
    heure_fin: champ(donnees, 'heure_fin', 5),
    capacite: Number(donnees.get('capacite')),
    tarif: donnees.get('tarif') === '' || donnees.get('tarif') == null ? null : Number(donnees.get('tarif')),
    publie: donnees.get('publie') === 'on',
  };
  let erreur = '';
  if (!valeurs.titre) erreur = 'Le titre est obligatoire.';
  else if (!DATE_ISO.test(valeurs.date)) erreur = 'La date est invalide.';
  else if (!HEURE.test(valeurs.heure_debut) || !HEURE.test(valeurs.heure_fin)) erreur = 'Les horaires sont invalides.';
  else if (valeurs.heure_fin <= valeurs.heure_debut) erreur = 'L’heure de fin doit être après l’heure de début.';
  else if (!Number.isInteger(valeurs.capacite) || valeurs.capacite < 1) erreur = 'Le nombre de places est invalide.';
  else if (valeurs.tarif != null && (Number.isNaN(valeurs.tarif) || valeurs.tarif < 0)) erreur = 'Le tarif est invalide.';
  return { valeurs, erreur };
}
