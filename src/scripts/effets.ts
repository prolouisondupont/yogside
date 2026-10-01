// Effets du site actuel (Elementor), reproduits sans dépendance.
// Pilotés par des attributs dans le HTML :
//   data-apparition="fondu" | "fondu-haut"   (+ style="--delai: 300ms")
//   data-parallaxe="2.5"                      vitesse, négative = sens inverse
//   data-rotation="-1"                        vitesse de rotation au défilement
//   data-ordi-seulement                       effet de défilement réservé au grand écran
// Tout est désactivé si le visiteur a demandé à réduire les animations.

const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const grandEcran = window.matchMedia('(min-width: 64rem)');

// --- Apparitions à l'entrée dans l'écran ---

const aApparaitre = document.querySelectorAll<HTMLElement>('[data-apparition]');

if (reduit || !('IntersectionObserver' in window)) {
  aApparaitre.forEach((el) => el.classList.add('est-visible'));
} else {
  const observateur = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        entree.target.classList.add('est-visible');
        observateur.unobserve(entree.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  aApparaitre.forEach((el) => observateur.observe(el));
}

// --- Parallaxe et rotation au défilement ---

type Anime = { el: HTMLElement; vitesse: number; rotation: boolean; ordiSeulement: boolean };

const animes: Anime[] = [
  ...[...document.querySelectorAll<HTMLElement>('[data-parallaxe]')].map((el) => ({
    el,
    vitesse: Number(el.dataset.parallaxe) || 1,
    rotation: false,
    ordiSeulement: el.hasAttribute('data-ordi-seulement'),
  })),
  ...[...document.querySelectorAll<HTMLElement>('[data-rotation]')].map((el) => ({
    el,
    vitesse: Number(el.dataset.rotation) || 1,
    rotation: true,
    ordiSeulement: el.hasAttribute('data-ordi-seulement'),
  })),
];

// Amplitudes calées à l'œil sur le site actuel
const PX_PAR_VITESSE = 24;
const DEGRES_PAR_VITESSE = 120;

function mettreAJour() {
  const hauteur = window.innerHeight;
  for (const a of animes) {
    if (a.ordiSeulement && !grandEcran.matches) {
      a.el.style.transform = '';
      continue;
    }
    // Mesure sur le parent, qui ne bouge pas : pas de boucle de rétroaction
    const boite = (a.el.parentElement ?? a.el).getBoundingClientRect();
    // 0 quand l'élément entre par le bas, 1 quand il sort par le haut
    const progression = Math.min(1, Math.max(0, (hauteur - boite.top) / (hauteur + boite.height)));
    if (a.rotation) {
      a.el.style.transform = `rotate(${(progression * DEGRES_PAR_VITESSE * a.vitesse).toFixed(1)}deg)`;
    } else {
      a.el.style.transform = `translate3d(0, ${((0.5 - progression) * 2 * PX_PAR_VITESSE * a.vitesse).toFixed(1)}px, 0)`;
    }
  }
}

if (!reduit && animes.length) {
  let enAttente = false;
  const demander = () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(() => {
      enAttente = false;
      mettreAJour();
    });
  };
  window.addEventListener('scroll', demander, { passive: true });
  window.addEventListener('resize', demander);
  grandEcran.addEventListener('change', demander);
  mettreAJour();
}
