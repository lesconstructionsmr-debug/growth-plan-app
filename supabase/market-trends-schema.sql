-- Table pour stocker les indicateurs macroéconomiques du marché québécois
create table if not exists public.market_trends (
  id           uuid primary key default gen_random_uuid(),
  date_ref     date not null,
  indicateur   text not null,
  valeur       numeric(12,2) not null,
  unite        text not null,
  categorie    text not null, -- 'matériaux' | 'logement' | 'taux'
  region       text not null default 'Québec',
  created_at   timestamptz default now()
);

-- RLS
alter table public.market_trends enable row level security;

-- Politique de lecture : accessible en lecture seule pour tout le monde (données publiques)
drop policy if exists "market_trends_read_policy" on public.market_trends;
create policy "market_trends_read_policy" on public.market_trends
  for select using (true);
