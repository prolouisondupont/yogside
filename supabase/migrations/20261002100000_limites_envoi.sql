-- Anti-abus du formulaire de connexion : un lien par minute et par adresse.
-- Table réservée au serveur (clé de service) : RLS sans politique.
create table public.limites_envoi (
  email          text primary key check (email = lower(email)),
  dernier_envoi  timestamptz not null default now()
);

alter table public.limites_envoi enable row level security;
revoke all on public.limites_envoi from anon, authenticated;
