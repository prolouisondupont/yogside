// Textes du site actuel (yogside.com) au 01/10/2026, repris tels quels.
// Ne sert plus qu'au script d'import initial vers Sanity : le site lit désormais
// ses contenus dans Sanity. Seules les fautes évidentes ont été corrigées.

export const descriptions = {
  'Hatha flow':
    'Une classe traditionnelle dans l’observance des alignements et de la circulation de l’énergie dans la posture. Une pratique stimulante et apaisante, reliant corps et esprit.',
  Vinyasa:
    'Une pratique intense invitant au lâcher-prise. Les poses s’enchaînent de façon dynamique afin de réveiller Agni (le feu). Détoxifiante, entraînante et énergisante, le vinyasa permet de trouver la fluidité entre mouvement et respiration tout en restant connecté au ressenti.',
  Workshops:
    'Des classes mensuelles de 2h30 orientées autour d’une thématique précise. La durée des cours nous permet d’aller plus loin dans l’exploration du souffle, des postures et de la méditation.',
} as const;

export const accueil = {
  titre: 'YOGSIDE : votre cours de YOGA',
  intro: 'Yogside ce sont des cours de Yoga adaptés à tous.tes, et à tous moments.',
  mathilde: {
    titre: 'Je m’appelle Mathilde, bienvenue dans votre Yogside',
    texte:
      'Passionnée depuis mon plus jeune âge par l’activité physique en général j’ai découvert le yoga au début de mon adolescence…',
  },
};

export const lesCours = {
  titre: 'Bienvenue dans votre Yogside :',
  intro:
    'Un moment d’exploration des sensations du corps par le mouvement, de connexion à l’énergie par le souffle, d’apaisement par le ralentissement du mental, de voyage vers soi-même guidé par le Yoga.',
  philosophie: [
    'Chaque classe comporte des techniques de respiration (pranayamas), des postures (asanas), et de la méditation (dhyana).',
    'Suivre le souffle, bouger le corps, observer le mental et poser la concentration.',
    'Une prise de contrôle tout en lâcher-prise, une recherche de rigueur tout en fluidité, un moment de reconnexion à soi.',
  ],
  colonnes: [
    'Des classes adaptées à toutes et à tous, désignées pour que chacun puisse se reconnecter à cet espace inné de lumière, d’énergie, d’ouverture aux possibles.',
    'S’accorder au souffle, libérer le mouvement, développer la confiance, par une pratique du Yoga traditionnelle, décomplexée et libératrice.',
  ],
  mantra: 'TRANSMETTRE - PRATIQUER - EXPLORER - PARTAGER - RESPIRER',
};

// Les fragments entre ** sont affichés en gras, comme sur le site actuel.
export const tarifs = {
  titre: 'Tarifs à partir de septembre 2026',
  lignes: [
    'Le cours à l’**unité** est à **18€**',
    'La carte de **5 séances** est à **85€** (valable 2 mois à partir de l’achat)',
    'La carte de **10 séances** est à **160€** (valable 4 mois à partir de l’achat)',
    'Abonnement trimestriels, 1 cours/ semaine (**du 9.09 au 23.12 soit 16 cours = 230€**)  paiement en plusieurs fois possible.',
    'En cas d’impossibilité un rattrapage de cours est possible dans les 2 semaines suivant l’absence.',
    'Pour un deuxième cours/ semaine, **– 15% sur l’abonnement.**',
    'Pour les cours particuliers / en entreprise, [contactez-moi pour un devis]',
    'Les cours sont limités à 12 personnes.',
    'En cas d’annulation moins de 6h avant la classe, le cours sera dû.',
    'Les abonnements/ cartes sont nominatifs et non remboursables.',
    'La situation financière ne devant pas être un frein pour la pratique, merci de me contacter en cas de difficulté.',
  ],
};

export const aPropos = {
  prenom: 'Mathilde',
  nom: 'Bertrand',
  intro:
    'Initialement formée à BPJEPS AGFF, j’ai décollé pour l’Inde le lendemain de l’obtention de mon diplôme pour mes premiers 200 heures auprès de la Rishikul Yogshala à Rishikesh (2017).',
  paragraphes1: [
    'Le mouvement a toujours fait partie de ma vie et de mon quotidien, la découverte du Yoga à mes 16 ans (avec Sokou Fujisaki, professeur de Yoga à Tours) a créé en moi un pont reliant tous mes besoins et toutes mes pratiques. La rigueur de l’alignement, l’adaptation à tous pour une approche fonctionnelle, le passage par le corps, l’observation des sensations, la pause du mental par le ralentissement des pensées. La pratique du Yoga sur le tapis bien sûr mais également le post Yoga ; cette diffusion des effets sur le long terme et au quotidien, développer plus d’écoute de soi et des autres, cultiver la pratique sans quête d’objectif ou de performance, simplement pour être là, connecter à son intuition, respirer pleinement, se détacher du résultat et cultiver cette conscience du moment présent.',
  ],
  citation: '« Yoga Shchitta Vritti Nirodhah : Le Yoga est l’arrêt automatique du mental »',
  source: 'Yoga Sutras, Patanjali',
  paragraphes2: [
    'Je continue de me former par une pratique personnelle, le suivi régulier de classes, d’ateliers en France et à l’étranger mais également par un 300h dans le Kerala (2018) et des voyages réguliers pour retrouver ceux que j’appelle « mes professeurs » et continuer d’explorer la pratique.',
    'Depuis 2017, j’enseigne à Tours auprès d’un public varié, en cours collectifs, en cours privés ou au sein d’entreprise. Transmettre ce que je pratique sur le tapis et dans la vie m’est apparu essentiel pour partager ce que le Yoga m’apporte au quotidien. J’ai compris qu’il y avait autant de Yoga qu’il y avait de professeurs, alors tout en suivant la tradition, je m’efforce de vous inviter à l’observation de ce que vous êtes, à laisser de la place à chacun de s’accepter, pour découvrir, évoluer sur ce chemin de l’apaisement, de la conscience et de la liberté.',
  ],
  conclusion:
    'Partager avec vous ce voyage à l’intérieur, pratiquer comme si c’était la première et dernière fois, se souvenir que tout est possible et se donner l’opportunité d’être soi même.',
};

export const evenements = {
  titre: 'Événements à venir :',
  // Associe un titre de workshop (table workshops) à son texte et sa photo
  types: {
    'Yin & bain sonore': {
      titre: 'Yin et Bain sonore',
      sousTitre: 'Les samedis à la Fabrique des Possibles',
      photo: 'IMG_8825.jpg',
    },
    'Workshop yoga': {
      titre: 'Workshop Yoga',
      sousTitre: 'Les dimanches de 9h30 à 12h00 à la Fabrique des possibles',
      photo: 'mathilde-yogside-juin-2022-ulrike-photographe-tours-49.jpg',
    },
  } as Record<string, { titre: string; sousTitre: string; photo: string }>,
  mentions: ['Règlement sur place le jour de l’atelier', 'Places limitées'],
};

export const reservation = {
  rappel: 'Pensez à amener votre tapis et une tenue confortable ! (Si besoin me prévenir pour le prêt du tapis)',
  annulation:
    'En cas d’annulation moins de 6h avant la classe, le cours sera dû. En cas d’impossibilité, un rattrapage est possible dans les 2 semaines suivant l’absence.',
};

export const newsletter = {
  titre: 'Soyez prévenu des actualités de Yogside 👇',
  texte: 'Tous les mois, des pensées, des conseils et l’actualité de Yogside dans votre boite mail',
};
