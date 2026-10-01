// Liens du site, partagés entre l'en-tête et le pied de page.
// Le journal et la boutique de la maquette ne font pas partie de la refonte.

export const liens = {
  principaux: [
    { libelle: 'À propos', href: '/a-propos' },
    { libelle: 'Les cours', href: '/cours' },
    { libelle: 'Planning', href: '/planning' },
  ],
  contact: { libelle: 'Me contacter', href: '/contact' },
  reservation: { libelle: 'Réserver un cours', href: '/planning' },
  // Provisoire : ces coordonnées viendront de Sanity
  reseaux: {
    instagram: 'https://www.instagram.com/yogside_fr/',
    facebook: 'https://www.facebook.com/yogside',
  },
  email: 'info@yogside.com',
} as const;
