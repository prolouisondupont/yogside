// Mise en forme des dates et heures, toujours à l'heure de Paris.

const FUSEAU = 'Europe/Paris';

/** "2026-10-05" → Date à midi UTC, pour éviter tout décalage de jour */
function depuisISO(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

/** "lundi 5 octobre" */
export function dateLongue(date: string) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: FUSEAU }).format(depuisISO(date));
}

/** "lundi 5 octobre 2026" */
export function dateComplete(date: string) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: FUSEAU }).format(depuisISO(date));
}

/** "5 oct." */
export function dateCourte(date: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: FUSEAU }).format(depuisISO(date));
}

/** "19:00:00" → "19:00" */
export function heure(h: string) {
  return h.slice(0, 5);
}

/** "08:45:00" → "8:45", comme sur le site actuel */
export function heureCourte(h: string) {
  return h.slice(0, 5).replace(/^0/, '');
}

const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** 1 → "Lundi" (norme ISO, 1 = lundi) */
export function nomJour(jour: number) {
  return JOURS[jour] ?? '';
}

/** 35 → "35 €" */
export function prix(montant: number | null) {
  if (montant == null) return '';
  return `${Number.isInteger(Number(montant)) ? Number(montant) : Number(montant).toFixed(2).replace('.', ',')} €`;
}

/** Lien Google Maps vers une adresse */
export function lienCarte(adresse: string, codePostal: string, ville: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${adresse}, ${codePostal} ${ville}`)}`;
}
