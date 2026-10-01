// Inscription à la newsletter : ajoute le contact à la liste Brevo.
// La clé Brevo ne quitte jamais le serveur.
import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const POST: APIRoute = async ({ request, redirect }) => {
  const donnees = await request.formData();
  const email = String(donnees.get('email') ?? '').trim().toLowerCase();
  const retour = String(donnees.get('retour') ?? '/');
  const enJson = request.headers.get('accept')?.includes('application/json');
  const pageRetour = retour.startsWith('/') && !retour.startsWith('//') ? retour : '/';

  const repondre = (ok: boolean, message: string) =>
    enJson
      ? new Response(JSON.stringify({ message }), {
          status: ok ? 200 : 400,
          headers: { 'Content-Type': 'application/json' },
        })
      : redirect(`${pageRetour}?newsletter=${ok ? 'ok' : 'erreur'}#newsletter-titre`, 303);

  if (!EMAIL.test(email)) {
    return repondre(false, 'Cette adresse email ne semble pas valide.');
  }

  const cle = import.meta.env.BREVO_API_KEY;
  const liste = Number(import.meta.env.BREVO_LISTE_ID);
  if (!cle || !liste) {
    console.error('Newsletter : BREVO_API_KEY ou BREVO_LISTE_ID manquant');
    return repondre(false, 'L’inscription est momentanément indisponible. Réessayez plus tard.');
  }

  const reponse = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': cle, 'Content-Type': 'application/json', Accept: 'application/json' },
    // updateEnabled : un contact déjà connu est simplement ajouté à la liste
    body: JSON.stringify({ email, listIds: [liste], updateEnabled: true }),
  });

  if (!reponse.ok) {
    console.error('Newsletter : erreur Brevo', reponse.status, await reponse.text());
    return repondre(false, 'L’inscription n’a pas pu aboutir. Réessayez plus tard.');
  }

  return repondre(true, 'Merci ! Votre inscription est bien prise en compte.');
};
