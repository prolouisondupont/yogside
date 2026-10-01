/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  /** Clé de service : uniquement dans le code serveur */
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly BREVO_API_KEY?: string;
  readonly BREVO_LISTE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
