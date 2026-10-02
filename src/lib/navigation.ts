// Liens du site, partagés entre l'en-tête et le pied de page.
// Les coordonnées (email, réseaux) viennent des réglages Sanity.

export const liens = {
  principaux: [
    { libelle: 'Les cours', href: '/cours' },
    { libelle: 'À propos', href: '/a-propos' },
    { libelle: 'Événements', href: '/evenements' },
  ],
  reservation: { libelle: 'Réserver un cours', href: '/planning' },
} as const;
