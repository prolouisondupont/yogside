// Tâche quotidienne (Vercel Cron, vers 18h à Paris) :
// génère les séances des 8 prochaines semaines, puis envoie les rappels du lendemain.
import type { APIRoute } from 'astro';
import { autoriserTache, reponseJson } from '../../../lib/cron';
import { envoyerRappels, genererSeances } from '../../../lib/taches';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!autoriserTache(request)) return reponseJson({ erreur: 'non autorisé' }, 401);

  const resultat: Record<string, unknown> = {};
  try {
    resultat.seances_creees = await genererSeances();
  } catch (e) {
    console.error('Génération des séances', e);
    resultat.generation = 'échec';
  }
  try {
    resultat.rappels = await envoyerRappels();
  } catch (e) {
    console.error('Rappels', e);
    resultat.rappels = 'échec';
  }
  return reponseJson(resultat);
};
