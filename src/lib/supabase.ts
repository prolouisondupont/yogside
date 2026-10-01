import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const options = { auth: { persistSession: false, autoRefreshToken: false } };

/** Client public (clé anon) : lectures soumises au RLS — planning, jauges, lieux. */
export const supabasePublic = createClient(url, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, options);

/**
 * Client de service : contourne le RLS. Uniquement dans les routes et pages
 * rendues côté serveur, jamais importé dans un script client.
 */
export function supabaseService() {
  if (import.meta.env.SSR !== true) {
    throw new Error('La clé de service ne doit jamais être utilisée côté navigateur.');
  }
  return createClient(url, import.meta.env.SUPABASE_SERVICE_ROLE_KEY, options);
}
