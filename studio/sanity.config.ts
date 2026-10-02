import { defineConfig } from 'sanity';
import { structureTool, type StructureResolver } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { frFRLocale } from '@sanity/locale-fr-fr';
import { photo, texteRiche } from './schemas/communs';
import { pageAccueil, pageAPropos, pageCours, pageEvenements, reglages } from './schemas/pages';

// Chaque page est une fiche unique (singleton) : pas de création ni de suppression.
const PAGES = [
  { type: 'pageAccueil', titre: 'Accueil' },
  { type: 'pageCours', titre: 'Les cours' },
  { type: 'pageAPropos', titre: 'À propos' },
  { type: 'pageEvenements', titre: 'Événements' },
  { type: 'reglages', titre: 'Réglages généraux' },
];
const TYPES_UNIQUES = new Set(PAGES.map((p) => p.type));

const structure: StructureResolver = (S) =>
  S.list()
    .title('Site Yogside')
    .items(
      PAGES.map((p) =>
        S.listItem()
          .title(p.titre)
          .id(p.type)
          .schemaType(p.type)
          .child(S.document().schemaType(p.type).documentId(p.type).title(p.titre)),
      ),
    );

export default defineConfig({
  name: 'yogside',
  title: 'Yogside',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'vl8aocgi',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',

  plugins: [
    structureTool({ structure }),
    frFRLocale(),
    // Outil de requêtes GROQ, utile au développement uniquement
    ...(process.env.NODE_ENV === 'development' ? [visionTool()] : []),
  ],

  schema: {
    types: [texteRiche, photo, reglages, pageAccueil, pageCours, pageAPropos, pageEvenements],
    // Pas de « Créer un document » pour les pages uniques
    templates: (modeles) => modeles.filter(({ schemaType }) => !TYPES_UNIQUES.has(schemaType)),
  },

  document: {
    // Ni suppression ni duplication des pages uniques
    actions: (actions, { schemaType }) =>
      TYPES_UNIQUES.has(schemaType)
        ? actions.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
});
