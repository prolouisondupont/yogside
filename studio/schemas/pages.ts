// Une fiche par page du site. Les cours, horaires, lieux et workshops ne sont
// PAS ici : ils se gèrent dans l'espace de gestion (yogside…/admin).
import { defineArrayMember, defineField, defineType } from 'sanity';
import { CogIcon, HomeIcon, CalendarIcon, UserIcon, SparklesIcon } from '@sanity/icons';

export const reglages = defineType({
  name: 'reglages',
  title: 'Réglages généraux',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'contact', title: 'Contact', default: true },
    { name: 'reservation', title: 'Réservation' },
    { name: 'basDePage', title: 'Bas de page' },
  ],
  fields: [
    defineField({ name: 'email', title: 'Email de contact', type: 'string', group: 'contact', validation: (r) => r.required().email() }),
    defineField({ name: 'telephone', title: 'Téléphone', type: 'string', group: 'contact' }),
    defineField({ name: 'instagram', title: 'Lien Instagram', type: 'url', group: 'contact' }),
    defineField({ name: 'facebook', title: 'Lien Facebook', type: 'url', group: 'contact' }),
    defineField({
      name: 'rappelTapis',
      title: 'Rappel avant le cours',
      type: 'text',
      rows: 2,
      group: 'reservation',
      description: 'Affiché sur le formulaire de réservation et dans les mails.',
    }),
    defineField({
      name: 'regleAnnulation',
      title: 'Règle d’annulation',
      type: 'text',
      rows: 3,
      group: 'reservation',
      description: 'Affichée à titre informatif (formulaire, mails, espace élève). Aucun contrôle automatique.',
    }),
    defineField({ name: 'newsletterTitre', title: 'Newsletter — titre', type: 'string', group: 'basDePage' }),
    defineField({ name: 'newsletterTexte', title: 'Newsletter — texte', type: 'string', group: 'basDePage' }),
    defineField({
      name: 'bandePhotos',
      title: 'Bande de photos',
      type: 'array',
      group: 'basDePage',
      description: 'Le carrousel en bas de chaque page. 4 photos visibles à la fois, au format portrait.',
      of: [defineArrayMember({ type: 'photo' })],
      validation: (r) => r.min(4),
    }),
  ],
  preview: { prepare: () => ({ title: 'Réglages généraux' }) },
});

export const pageAccueil = defineType({
  name: 'pageAccueil',
  title: 'Accueil',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({ name: 'titre', title: 'Titre principal', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'photoOuverture', title: 'Photo d’ouverture', type: 'photo' }),
    defineField({ name: 'intro', title: 'Phrase d’introduction', type: 'text', rows: 2 }),
    defineField({
      name: 'cartes',
      title: 'Cartes des cours',
      type: 'array',
      description: 'Les trois colonnes dont la photo change au survol.',
      validation: (r) => r.length(3),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'carte',
          fields: [
            defineField({ name: 'titre', title: 'Titre', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'texte', title: 'Texte', type: 'text', rows: 4 }),
            defineField({ name: 'photo', title: 'Photo', type: 'photo' }),
            defineField({
              name: 'lien',
              title: 'Lien « En savoir plus »',
              type: 'string',
              description: 'Une page du site, par ex. /cours#vinyasa ou /evenements',
            }),
          ],
          preview: { select: { title: 'titre', media: 'photo' } },
        }),
      ],
    }),
    defineField({ name: 'mathildeTitre', title: 'Bloc présentation — titre', type: 'string' }),
    defineField({ name: 'mathildeTexte', title: 'Bloc présentation — texte', type: 'text', rows: 3 }),
    defineField({ name: 'mathildePortrait', title: 'Bloc présentation — portrait', type: 'photo' }),
  ],
  preview: { prepare: () => ({ title: 'Accueil' }) },
});

export const pageCours = defineType({
  name: 'pageCours',
  title: 'Les cours',
  type: 'document',
  icon: SparklesIcon,
  groups: [
    { name: 'presentation', title: 'Présentation', default: true },
    { name: 'tarifs', title: 'Tarifs' },
    { name: 'pratique', title: 'La pratique' },
  ],
  fields: [
    defineField({ name: 'titre', title: 'Titre', type: 'string', group: 'presentation' }),
    defineField({ name: 'intro', title: 'Introduction', type: 'text', rows: 3, group: 'presentation' }),
    defineField({
      name: 'presentations',
      title: 'Présentation des cours',
      type: 'array',
      group: 'presentation',
      description: 'Les trois colonnes (Hatha flow, Vinyasa, Workshops). Les horaires s’affichent automatiquement depuis l’espace de gestion.',
      validation: (r) => r.length(3),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'presentationCours',
          fields: [
            defineField({
              name: 'nom',
              title: 'Nom du cours',
              type: 'string',
              description: 'Doit être écrit exactement comme dans l’espace de gestion (ex. « Hatha flow ») pour afficher les bons horaires.',
              validation: (r) => r.required(),
            }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 5 }),
            defineField({ name: 'photo', title: 'Photo', type: 'photo' }),
          ],
          preview: { select: { title: 'nom', media: 'photo' } },
        }),
      ],
    }),
    defineField({ name: 'tarifsTitre', title: 'Titre des tarifs', type: 'string', group: 'tarifs' }),
    defineField({
      name: 'tarifs',
      title: 'Tarifs et conditions',
      type: 'texteRiche',
      group: 'tarifs',
      description: 'Sélectionnez un mot puis « B » pour le mettre en gras.',
    }),
    defineField({
      name: 'philosophie',
      title: 'Liste « la pratique »',
      type: 'array',
      group: 'pratique',
      of: [defineArrayMember({ type: 'text', rows: 2 })],
    }),
    defineField({ name: 'philosophiePhoto', title: 'Photo à côté de la liste', type: 'photo', group: 'pratique' }),
    defineField({
      name: 'colonnes',
      title: 'Deux textes côte à côte',
      type: 'array',
      group: 'pratique',
      validation: (r) => r.max(2),
      of: [defineArrayMember({ type: 'text', rows: 3 })],
    }),
    defineField({ name: 'mantra', title: 'Phrase finale', type: 'string', group: 'pratique' }),
  ],
  preview: { prepare: () => ({ title: 'Les cours' }) },
});

export const pageAPropos = defineType({
  name: 'pageAPropos',
  title: 'À propos',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({ name: 'prenom', title: 'Prénom', type: 'string' }),
    defineField({ name: 'nom', title: 'Nom', type: 'string' }),
    defineField({ name: 'portrait', title: 'Portrait (affiché en rond)', type: 'photo' }),
    defineField({ name: 'intro', title: 'Introduction', type: 'text', rows: 3 }),
    defineField({ name: 'texte1', title: 'Parcours — première partie', type: 'texteRiche' }),
    defineField({ name: 'citation', title: 'Citation', type: 'string' }),
    defineField({ name: 'sourceCitation', title: 'Source de la citation', type: 'string' }),
    defineField({ name: 'texte2', title: 'Parcours — suite', type: 'texteRiche' }),
    defineField({
      name: 'photos',
      title: 'Photos superposées',
      type: 'array',
      validation: (r) => r.max(2),
      of: [defineArrayMember({ type: 'photo' })],
    }),
    defineField({ name: 'conclusion', title: 'Phrase de conclusion', type: 'text', rows: 3 }),
  ],
  preview: { prepare: () => ({ title: 'À propos' }) },
});

export const pageEvenements = defineType({
  name: 'pageEvenements',
  title: 'Événements',
  type: 'document',
  icon: CalendarIcon,
  fields: [
    defineField({ name: 'titre', title: 'Titre', type: 'string' }),
    defineField({
      name: 'types',
      title: 'Types d’événements',
      type: 'array',
      description:
        'Habillage des workshops créés dans l’espace de gestion : les dates s’affichent automatiquement sous le bon type.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'typeEvenement',
          fields: [
            defineField({
              name: 'titreEnBase',
              title: 'Titre du workshop dans l’espace de gestion',
              type: 'string',
              description: 'Exactement le même titre (ex. « Workshop yoga »).',
              validation: (r) => r.required(),
            }),
            defineField({ name: 'titre', title: 'Titre affiché', type: 'string' }),
            defineField({ name: 'sousTitre', title: 'Sous-titre', type: 'string' }),
            defineField({ name: 'photo', title: 'Photo', type: 'photo' }),
          ],
          preview: { select: { title: 'titre', subtitle: 'titreEnBase', media: 'photo' } },
        }),
      ],
    }),
    defineField({
      name: 'mentions',
      title: 'Mentions en bas de page',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
  preview: { prepare: () => ({ title: 'Événements' }) },
});
