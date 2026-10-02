// Import initial des contenus du site actuel dans Sanity.
// Lancement : npm run import (dans studio/), avec un compte Sanity connecté.
// Ré-exécutable : les fiches sont remplacées, les photos déjà envoyées réutilisées.
import fs from 'node:fs';
import path from 'node:path';
import { getCliClient } from 'sanity/cli';
import { accueil, aPropos, descriptions, evenements, lesCours, newsletter, reservation, tarifs } from './contenus-initiaux';

const client = getCliClient({ apiVersion: '2025-01-01' });
const DOSSIER_PHOTOS = path.resolve(import.meta.dirname, '../../src/assets/site-actuel');

let compteur = 0;
const cle = () => `k${(compteur++).toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// --- Photos ---

const dejaEnvoyees = new Map<string, string>();

async function photo(fichier: string, alt: string) {
  if (!dejaEnvoyees.has(fichier)) {
    const existant = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $f][0]._id`, { f: fichier });
    const id = existant ?? (await client.assets.upload('image', fs.createReadStream(path.join(DOSSIER_PHOTOS, fichier)), { filename: fichier }))._id;
    dejaEnvoyees.set(fichier, id);
    console.log(`  photo ${existant ? 'réutilisée' : 'envoyée'} : ${fichier}`);
  }
  return { _type: 'photo', _key: cle(), alt, asset: { _type: 'reference', _ref: dejaEnvoyees.get(fichier)! } };
}

// --- Texte riche : « **gras** » et « [lien vers le contact] » ---

function bloc(texte: string, email = 'info@yogside.com') {
  const liens: { _key: string; _type: 'lien'; href: string }[] = [];
  const morceaux = texte.split(/(\*\*[^*]+\*\*|\[[^\]]+\])/g).filter(Boolean);
  const children = morceaux.map((m) => {
    if (m.startsWith('**')) return { _type: 'span', _key: cle(), text: m.slice(2, -2), marks: ['strong'] };
    if (m.startsWith('[')) {
      const lien = { _key: cle(), _type: 'lien' as const, href: `mailto:${email}` };
      liens.push(lien);
      return { _type: 'span', _key: cle(), text: m.slice(1, -1), marks: [lien._key] };
    }
    return { _type: 'span', _key: cle(), text: m, marks: [] };
  });
  return { _type: 'block', _key: cle(), style: 'normal', markDefs: liens, children };
}

const PHOTOS_COURS = {
  hatha: 'mathilde-yogside-juin-2022-ulrike-photographe-tours-26.jpg',
  vinyasa: 'mathilde-yogside-juin-2022-ulrike-photographe-tours-14.jpg',
  workshops: 'mathilde-yogside-juin-2022-ulrike-photographe-tours-19.jpg',
};

async function importer() {
  console.log('Photos…');
  const bande = await Promise.all(
    [
      'WhatsApp-Image-2022-06-23-at-18.29.49.jpeg',
      'WhatsApp-Image-2022-06-23-at-18.29.48.jpeg',
      'WhatsApp-Image-2022-06-23-at-18.33.59.jpeg',
      'WhatsApp-Image-2022-06-23-at-18.33.57.jpeg',
      'WhatsApp-Image-2022-06-23-at-18.29.51.jpeg',
    ].map((f) => photo(f, 'Photo d’un cours de yoga Yogside')),
  );

  const documents: { _id: string; _type: string; [champ: string]: unknown }[] = [
    {
      _id: 'reglages',
      _type: 'reglages',
      email: 'info@yogside.com',
      instagram: 'https://www.instagram.com/yogside_fr/',
      facebook: 'https://www.facebook.com/yogside',
      rappelTapis: reservation.rappel,
      regleAnnulation: reservation.annulation,
      newsletterTitre: newsletter.titre,
      newsletterTexte: newsletter.texte,
      bandePhotos: bande,
    },
    {
      _id: 'pageAccueil',
      _type: 'pageAccueil',
      titre: accueil.titre,
      photoOuverture: await photo('mathilde-yogside-juin-2022-ulrike-photographe-tours-10.jpg', 'Mathilde en posture de yoga devant un mur de pierre claire'),
      intro: accueil.intro,
      cartes: [
        { _type: 'carte', _key: cle(), titre: 'Hatha Flow', texte: descriptions['Hatha flow'], photo: await photo(PHOTOS_COURS.hatha, 'Mathilde en étirement sur son tapis'), lien: '/cours#hatha-flow' },
        { _type: 'carte', _key: cle(), titre: 'Vinyasa', texte: descriptions.Vinyasa, photo: await photo(PHOTOS_COURS.vinyasa, 'Mathilde en planche latérale'), lien: '/cours#vinyasa' },
        { _type: 'carte', _key: cle(), titre: 'Workshops', texte: descriptions.Workshops, photo: await photo(PHOTOS_COURS.workshops, 'Mathilde bras ouverts, en posture du guerrier'), lien: '/evenements' },
      ],
      mathildeTitre: accueil.mathilde.titre,
      mathildeTexte: accueil.mathilde.texte,
      mathildePortrait: await photo('portrait-home-2.png', 'Portrait de Mathilde, souriante'),
    },
    {
      _id: 'pageCours',
      _type: 'pageCours',
      titre: lesCours.titre,
      intro: lesCours.intro,
      presentations: [
        { _type: 'presentationCours', _key: cle(), nom: 'Hatha flow', description: descriptions['Hatha flow'], photo: await photo('H.png', 'Mathilde en posture de Hatha') },
        { _type: 'presentationCours', _key: cle(), nom: 'Vinyasa', description: descriptions.Vinyasa, photo: await photo('V.png', 'Mathilde en planche latérale') },
        { _type: 'presentationCours', _key: cle(), nom: 'Workshops', description: descriptions.Workshops, photo: await photo('W.png', 'Mathilde bras ouverts') },
      ],
      tarifsTitre: tarifs.titre,
      tarifs: tarifs.lignes.map((l) => bloc(l)),
      philosophie: lesCours.philosophie,
      philosophiePhoto: await photo(PHOTOS_COURS.hatha, 'Mathilde en étirement sur son tapis'),
      colonnes: lesCours.colonnes,
      mantra: lesCours.mantra,
    },
    {
      _id: 'pageAPropos',
      _type: 'pageAPropos',
      prenom: aPropos.prenom,
      nom: aPropos.nom,
      portrait: await photo('285250101_556566269505949_7252807008007773106_n-1.png', 'Portrait de Mathilde Bertrand'),
      intro: aPropos.intro,
      texte1: aPropos.paragraphes1.map((p) => bloc(p)),
      citation: aPropos.citation,
      sourceCitation: aPropos.source,
      texte2: aPropos.paragraphes2.map((p) => bloc(p)),
      photos: [
        await photo('inde1.png', 'Coucher de soleil entre les palmiers, en Inde'),
        await photo('inde2.png', 'Pratique de yoga en duo lors de la formation en Inde'),
      ],
      conclusion: aPropos.conclusion,
    },
    {
      _id: 'pageEvenements',
      _type: 'pageEvenements',
      titre: evenements.titre,
      types: await Promise.all(
        Object.entries(evenements.types).map(async ([titreEnBase, t]) => ({
          _type: 'typeEvenement',
          _key: cle(),
          titreEnBase,
          titre: t.titre,
          sousTitre: t.sousTitre,
          photo: await photo(t.photo, t.titre),
        })),
      ),
      mentions: evenements.mentions,
    },
  ];

  console.log('Fiches…');
  const transaction = client.transaction();
  for (const doc of documents) transaction.createOrReplace(doc);
  await transaction.commit();
  console.log(`✔ ${documents.length} fiches publiées, ${dejaEnvoyees.size} photos.`);
}

importer().catch((e) => {
  console.error(e);
  process.exit(1);
});
