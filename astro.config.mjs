// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Pages statiques par défaut ; les pages dynamiques (planning, réservation, admin)
// passeront en rendu serveur avec `export const prerender = false`.
export default defineConfig({
  adapter: vercel(),
});
