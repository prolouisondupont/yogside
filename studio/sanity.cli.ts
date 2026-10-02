import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  // Adresse du Studio en ligne : https://yogside.sanity.studio
  studioHost: 'yogside',
  deployment: { autoUpdates: true },
});
