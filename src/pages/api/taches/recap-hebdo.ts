// Tâche du dimanche soir (Vercel Cron) : récapitulatif de la semaine à venir
// envoyé à la professeure, cours par cours, avec la liste des inscrits.
import type { APIRoute } from 'astro';
import { autoriserTache, reponseJson } from '../../../lib/cron';
import { envoyerRecapHebdo } from '../../../lib/taches';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!autoriserTache(request)) return reponseJson({ erreur: 'non autorisé' }, 401);
  try {
    return reponseJson(await envoyerRecapHebdo());
  } catch (e) {
    console.error('Récap hebdomadaire', e);
    return reponseJson({ erreur: 'échec' }, 500);
  }
};
