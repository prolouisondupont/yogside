// Gestion — export CSV des inscrits d'une séance ou d'un workshop.
// Séparateur « ; » et BOM UTF-8 : s'ouvre directement dans Excel en français.
import type { APIRoute } from 'astro';
import { utilisateurConnecte } from '../../../../lib/auth';
import { UUID } from '../../../../lib/reservation';

export const prerender = false;

const cellule = (v: unknown) => {
  const texte = String(v ?? '');
  // Neutralise les formules (=, +, -, @) que pourrait interpréter un tableur
  const sur = /^[=+\-@]/.test(texte) ? `'${texte}` : texte;
  return `"${sur.replace(/"/g, '""')}"`;
};

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const { type, id } = params;
  if ((type !== 'seance' && type !== 'workshop') || !id || !UUID.test(id)) return new Response(null, { status: 404 });

  const { supabase, utilisateur } = await utilisateurConnecte(request, cookies);
  const { data: admin } = utilisateur ? await supabase.rpc('est_admin') : { data: false };
  if (admin !== true) return new Response('Accès réservé.', { status: 403 });

  const { data } = await supabase
    .from('reservations')
    .select('prenom, nom, email, telephone, pret_tapis, message, created_at')
    .eq(type === 'seance' ? 'seance_id' : 'workshop_id', id)
    .eq('statut', 'confirmee')
    .order('nom');

  const entete = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Prêt de tapis', 'Message', 'Réservé le'];
  const lignes = (data ?? []).map((r) =>
    [
      r.prenom,
      r.nom,
      r.email,
      r.telephone,
      r.pret_tapis ? 'oui' : 'non',
      r.message,
      new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(r.created_at)),
    ].map(cellule).join(';'),
  );

  const csv = '﻿' + [entete.map(cellule).join(';'), ...lignes].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inscrits-${type}-${id.slice(0, 8)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};
