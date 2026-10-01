// Liens du site, partagés entre l'en-tête et le pied de page.
// Même menu que le site actuel ; le bouton « Réserver un cours » mène au planning.

export const liens = {
  principaux: [
    { libelle: 'Les cours', href: '/cours' },
    { libelle: 'À propos', href: '/a-propos' },
    { libelle: 'Événements', href: '/evenements' },
  ],
  reservation: { libelle: 'Réserver un cours', href: '/planning' },
  // Provisoire : ces coordonnées viendront de Sanity
  email: 'info@yogside.com',
  reseaux: {
    instagram: 'https://www.instagram.com/yogside_fr/',
    facebook: 'https://www.facebook.com/yogside',
  },
} as const;
