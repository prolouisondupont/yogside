// Types réutilisés par toutes les pages.
import { defineArrayMember, defineField, defineType } from 'sanity';

/** Texte avec gras, italique et liens — sans titres, pour garder la mise en page du site */
export const texteRiche = defineType({
  name: 'texteRiche',
  title: 'Texte',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Paragraphe', value: 'normal' }],
      lists: [{ title: 'Liste à puces', value: 'bullet' }],
      marks: {
        decorators: [
          { title: 'Gras', value: 'strong' },
          { title: 'Italique', value: 'em' },
        ],
        annotations: [
          {
            name: 'lien',
            type: 'object',
            title: 'Lien',
            fields: [
              defineField({
                name: 'href',
                type: 'url',
                title: 'Adresse',
                description: 'Une page web (https://…) ou un email (mailto:info@yogside.com)',
                validation: (r) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
              }),
            ],
          },
        ],
      },
    }),
  ],
});

/** Image avec texte alternatif (lu par les lecteurs d'écran et par Google) */
export const photo = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      type: 'string',
      title: 'Description de la photo',
      description: 'Une phrase courte qui décrit la photo, pour les personnes malvoyantes. Ex. : « Mathilde en posture du guerrier ».',
    }),
  ],
});
