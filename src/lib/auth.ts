// Connexion par lien magique (élèves et professeure) — code serveur uniquement.
// Le lien est généré par Supabase côté serveur puis envoyé par Resend, pour
// garder un mail en français, aux couleurs du site, et la redirection de test.
import type { AstroCookies } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { supabaseService } from './supabase';
import { envoyer, mailConnexion } from './emails';

/** Client Supabase lié à la session de l'utilisateur (cookies) */
export function clientSession(request: Request, cookies: AstroCookies) {
  return createServerClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () =>
        parseCookieHeader(request.headers.get('Cookie') ?? '').map(({ name, value }) => ({ name, value: value ?? '' })),
      setAll: (aEcrire) => {
        // Session lue uniquement côté serveur : cookies inaccessibles au JavaScript du navigateur
        for (const { name, value, options } of aEcrire) {
          cookies.set(name, value, { ...options, path: '/', httpOnly: true, sameSite: 'lax', secure: import.meta.env.PROD });
        }
      },
    },
  });
}

/** Utilisateur connecté (vérifié auprès de Supabase), ou null */
export async function utilisateurConnecte(request: Request, cookies: AstroCookies) {
  const supabase = clientSession(request, cookies);
  const { data } = await supabase.auth.getUser();
  return { supabase, utilisateur: data.user };
}

export async function estAdmin(request: Request, cookies: AstroCookies) {
  const { supabase, utilisateur } = await utilisateurConnecte(request, cookies);
  if (!utilisateur) return false;
  const { data } = await supabase.rpc('est_admin');
  return data === true;
}

const DELAI_ENTRE_ENVOIS_MS = 60_000;

/** Seules les redirections internes sont acceptées après connexion */
export function cheminSur(suivant: string | null | undefined, defaut = '/mon-espace') {
  return suivant && suivant.startsWith('/') && !suivant.startsWith('//') ? suivant : defaut;
}

/**
 * Envoie un lien de connexion. Crée le compte s'il n'existe pas : la réponse
 * ne révèle donc jamais si une adresse avait déjà un compte.
 */
export async function envoyerLienConnexion(email: string, suivant: string): Promise<'envoye' | 'trop_tot' | 'echec'> {
  const db = supabaseService();

  // Anti-abus : un lien par minute et par adresse
  const { data: limite } = await db.from('limites_envoi').select('dernier_envoi').eq('email', email).maybeSingle();
  if (limite && Date.now() - new Date(limite.dernier_envoi).getTime() < DELAI_ENTRE_ENVOIS_MS) return 'trop_tot';
  await db.from('limites_envoi').upsert({ email, dernier_envoi: new Date().toISOString() });

  const { data, error } = await db.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data.properties?.hashed_token) {
    console.error('Lien de connexion : génération impossible', error);
    return 'echec';
  }

  const site = (import.meta.env.PUBLIC_SITE_URL ?? 'https://yogside.vercel.app').replace(/\/$/, '');
  const lien = `${site}/auth/confirmer?token_hash=${encodeURIComponent(data.properties.hashed_token)}&suivant=${encodeURIComponent(suivant)}`;
  return (await envoyer({ a: email, ...mailConnexion(lien) })) ? 'envoye' : 'echec';
}
