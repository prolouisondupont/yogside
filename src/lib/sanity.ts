// Contenus éditoriaux (Sanity) : textes, tarifs, photos.
// Le jeu de données est public en lecture : aucune clé n'est nécessaire.
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? 'vl8aocgi',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  // API en direct (pas le CDN de Sanity) : une publication est visible tout de suite.
  // Le cache d'une minute chez Vercel limite déjà le nombre de requêtes.
  useCdn: false,
  perspective: 'published',
});

const constructeur = createImageUrlBuilder(client);

// --- Types ---

export type Photo = {
  alt?: string;
  hotspot?: { x: number; y: number };
  crop?: { top: number; bottom: number; left: number; right: number };
  asset: { _id: string; metadata?: { dimensions?: { width: number; height: number } } };
};

export type Bloc = {
  _type: 'block';
  _key: string;
  style?: string;
  listItem?: 'bullet';
  markDefs?: { _key: string; _type: string; href?: string }[];
  children: { _key: string; text: string; marks?: string[] }[];
};

export type Reglages = {
  email: string;
  telephone?: string;
  instagram?: string;
  facebook?: string;
  rappelTapis?: string;
  regleAnnulation?: string;
  newsletterTitre?: string;
  newsletterTexte?: string;
  bandePhotos?: Photo[];
};

export type PageAccueil = {
  titre: string;
  photoOuverture?: Photo;
  intro?: string;
  cartes?: { titre: string; texte?: string; photo?: Photo; lien?: string }[];
  mathildeTitre?: string;
  mathildeTexte?: string;
  mathildePortrait?: Photo;
};

export type PageCours = {
  titre?: string;
  intro?: string;
  presentations?: { nom: string; description?: string; photo?: Photo }[];
  tarifsTitre?: string;
  tarifs?: Bloc[];
  philosophie?: string[];
  philosophiePhoto?: Photo;
  colonnes?: string[];
  mantra?: string;
};

export type PageAPropos = {
  prenom?: string;
  nom?: string;
  portrait?: Photo;
  intro?: string;
  texte1?: Bloc[];
  citation?: string;
  sourceCitation?: string;
  texte2?: Bloc[];
  photos?: Photo[];
  conclusion?: string;
};

export type PageEvenements = {
  titre?: string;
  types?: { titreEnBase: string; titre?: string; sousTitre?: string; photo?: Photo }[];
  mentions?: string[];
};

// --- Requêtes ---

// Une photo avec ses dimensions d'origine (pour réserver la place à l'affichage)
const PHOTO = `{ alt, hotspot, crop, asset->{ _id, metadata { dimensions { width, height } } } }`;

const REQUETES = {
  reglages: `*[_id == "reglages"][0]{ ..., bandePhotos[]${PHOTO} }`,
  pageAccueil: `*[_id == "pageAccueil"][0]{ ..., photoOuverture${PHOTO}, cartes[]{ ..., photo${PHOTO} }, mathildePortrait${PHOTO} }`,
  pageCours: `*[_id == "pageCours"][0]{ ..., presentations[]{ ..., photo${PHOTO} }, philosophiePhoto${PHOTO} }`,
  pageAPropos: `*[_id == "pageAPropos"][0]{ ..., portrait${PHOTO}, photos[]${PHOTO} }`,
  pageEvenements: `*[_id == "pageEvenements"][0]{ ..., types[]{ ..., photo${PHOTO} } }`,
} as const;

// Petit cache mémoire : une même fonction serveur sert plusieurs pages d'affilée
const cache = new Map<string, { expire: number; valeur: unknown }>();
const DUREE_CACHE_MS = 10_000;

async function lire<T>(cle: keyof typeof REQUETES): Promise<T> {
  const enCache = cache.get(cle);
  if (enCache && enCache.expire > Date.now()) return enCache.valeur as T;
  const valeur = await client.fetch<T>(REQUETES[cle]);
  cache.set(cle, { expire: Date.now() + DUREE_CACHE_MS, valeur });
  return valeur;
}

const REGLAGES_PAR_DEFAUT: Reglages = { email: 'info@yogside.com' };

export async function reglages(): Promise<Reglages> {
  return (await lire<Reglages | null>('reglages').catch(() => null)) ?? REGLAGES_PAR_DEFAUT;
}
export const pageAccueil = () => lire<PageAccueil>('pageAccueil');
export const pageCours = () => lire<PageCours>('pageCours');
export const pageAPropos = () => lire<PageAPropos>('pageAPropos');
export const pageEvenements = () => lire<PageEvenements>('pageEvenements');

// --- Images ---

/** URL d'une photo à une largeur donnée, au format le plus léger accepté par le navigateur */
export function urlPhoto(photo: Photo, largeur: number, hauteur?: number) {
  let image = constructeur.image(photo).width(largeur).auto('format').quality(80);
  if (hauteur) image = image.height(hauteur).fit('crop');
  return image.url();
}

/** Attributs src/srcset/width/height d'une photo responsive */
export function attributsPhoto(photo: Photo, largeurs: number[], ratio?: number) {
  const dim = photo.asset.metadata?.dimensions;
  const r = ratio ?? (dim ? dim.height / dim.width : 1);
  const max = Math.max(...largeurs);
  return {
    src: urlPhoto(photo, max, ratio ? Math.round(max * r) : undefined),
    srcset: largeurs.map((l) => `${urlPhoto(photo, l, ratio ? Math.round(l * r) : undefined)} ${l}w`).join(', '),
    width: max,
    height: Math.round(max * r),
    alt: photo.alt ?? '',
  };
}

/** Cache HTTP des pages éditoriales : une minute chez Vercel, puis mise à jour en arrière-plan */
export const CACHE_EDITORIAL = 'public, s-maxage=60, stale-while-revalidate=86400';

// Textes de secours si un champ est vidé dans le Studio
const DEFAUTS = {
  rappel: 'Pensez à amener votre tapis et une tenue confortable ! (Si besoin me prévenir pour le prêt du tapis)',
  annulation:
    'En cas d’annulation moins de 6h avant la classe, le cours sera dû. En cas d’impossibilité, un rattrapage est possible dans les 2 semaines suivant l’absence.',
};

/** Textes repris dans le formulaire de réservation, les confirmations et les mails */
export async function textesReservation() {
  const r = await reglages();
  return {
    rappel: r.rappelTapis || DEFAUTS.rappel,
    annulation: r.regleAnnulation || DEFAUTS.annulation,
    email: r.email || REGLAGES_PAR_DEFAUT.email,
  };
}
export type TextesReservation = Awaited<ReturnType<typeof textesReservation>>;
