// Protection des routes de tâches planifiées : Vercel Cron envoie
// « Authorization: Bearer <CRON_SECRET> ». Sans ce secret, la route refuse.

export function autoriserTache(request: Request) {
  const secret = import.meta.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

export function reponseJson(donnees: unknown, status = 200) {
  return new Response(JSON.stringify(donnees), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
