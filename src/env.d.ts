/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  /** Clé de service : uniquement dans le code serveur */
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly RESEND_API_KEY: string;
  readonly EMAIL_EXPEDITEUR?: string;
  readonly EMAIL_PROF?: string;
  /** Site de test : tous les mails partent vers cette adresse */
  readonly EMAIL_REDIRECTION?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly CRON_SECRET?: string;
  readonly BREVO_API_KEY?: string;
  readonly BREVO_LISTE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
