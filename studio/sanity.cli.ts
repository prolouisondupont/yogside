import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'vl8aocgi',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  // Adresse du Studio en ligne : https://yogside.sanity.studio
  studioHost: 'yogside',
  deployment: { appId: 'ss7lg0es2pb0pi2vkj2e34y3', autoUpdates: true },
});
