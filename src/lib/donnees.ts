// Lectures Supabase utilisées par les pages publiques (clé anon, RLS).
import { supabasePublic } from './supabase';

export type Lieu = {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
};

export type Creneau = {
  id: string;
  nom: string;
  description: string | null;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  lieu: Lieu;
};

export type SeanceDispo = {
  id: string;
  cours_id: string;
  nom: string;
  lieu_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  capacite: number;
  annulee: boolean;
  motif_annulation: string | null;
  inscrits: number;
  places_restantes: number;
  reservable: boolean;
};

export type WorkshopDispo = {
  id: string;
  titre: string;
  description: string | null;
  lieu_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  tarif: number | null;
  capacite: number;
  annule: boolean;
  motif_annulation: string | null;
  inscrits: number;
  places_restantes: number;
  reservable: boolean;
  publie: boolean;
};

function aujourdhuiParis() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
}

/** Créneaux hebdomadaires de la saison en cours, triés par jour puis heure */
export async function creneauxSaison(): Promise<Creneau[]> {
  const aujourdhui = aujourdhuiParis();
  const { data, error } = await supabasePublic
    .from('cours')
    .select('id, nom, description, jour_semaine, heure_debut, heure_fin, lieu:lieux(id, nom, adresse, code_postal, ville)')
    .eq('actif', true)
    .lte('saison_debut', aujourdhui)
    .gte('saison_fin', aujourdhui)
    .order('jour_semaine')
    .order('heure_debut');
  if (error) throw error;
  return data as unknown as Creneau[];
}

export async function lieux(): Promise<Map<string, Lieu>> {
  const { data, error } = await supabasePublic.from('lieux').select('id, nom, adresse, code_postal, ville');
  if (error) throw error;
  return new Map((data as Lieu[]).map((l) => [l.id, l]));
}

/** Séances à venir (aujourd'hui inclus) sur `jours` jours */
export async function seancesAVenir(jours = 28): Promise<SeanceDispo[]> {
  const debut = aujourdhuiParis();
  const fin = new Date(Date.now() + jours * 864e5).toISOString().slice(0, 10);
  const { data, error } = await supabasePublic
    .from('seances_disponibilite')
    .select('*')
    .gte('date', debut)
    .lte('date', fin)
    .order('date')
    .order('heure_debut');
  if (error) throw error;
  return data as SeanceDispo[];
}

export async function workshopsAVenir(): Promise<WorkshopDispo[]> {
  const { data, error } = await supabasePublic
    .from('workshops_disponibilite')
    .select('*')
    .gte('date', aujourdhuiParis())
    .order('date')
    .order('heure_debut');
  if (error) throw error;
  return data as WorkshopDispo[];
}

export async function seance(id: string): Promise<SeanceDispo | null> {
  const { data } = await supabasePublic.from('seances_disponibilite').select('*').eq('id', id).maybeSingle();
  return data as SeanceDispo | null;
}

export async function workshop(id: string): Promise<WorkshopDispo | null> {
  const { data } = await supabasePublic.from('workshops_disponibilite').select('*').eq('id', id).maybeSingle();
  return data as WorkshopDispo | null;
}

/** Regroupe les créneaux par nom de cours ("Hatha flow", "Vinyasa") */
export function parCours(creneaux: Creneau[]) {
  const groupes = new Map<string, Creneau[]>();
  for (const c of creneaux) groupes.set(c.nom, [...(groupes.get(c.nom) ?? []), c]);
  return groupes;
}
