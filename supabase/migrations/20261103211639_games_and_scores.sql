create table public.games (
  id       text primary key,
  title    text not null,
  cat      text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  playable boolean not null default false
);

create table public.scores (
  id          uuid primary key default gen_random_uuid(),
  game_id     text not null references public.games(id),
  player_name text not null check (char_length(player_name) between 1 and 10),
  score       integer not null check (score >= 0 and score <= 10000000),
  created_at  timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc, created_at);

alter table public.games  enable row level security;
alter table public.scores enable row level security;

grant select on public.games  to anon, authenticated;
grant select, insert on public.scores to anon, authenticated;

create policy "games_select_all" on public.games
  for select to anon, authenticated
  using (true);

create policy "scores_select_all" on public.scores
  for select to anon, authenticated
  using (true);

create policy "scores_insert_playable" on public.scores
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.games g
      where g.id = game_id and g.playable
    )
  );

insert into public.games (id, title, cat, playable) values
  ('bloque-buster', 'BLOQUE BUSTER', 'ARCADE',  false),
  ('caida',         'CAÍDA',         'PUZZLE',  false),
  ('serpentina',    'SERPENTINA',    'ARCADE',  false),
  ('gloton',        'GLOTÓN',        'ARCADE',  false),
  ('invasores',     'INVASORES',     'SHOOTER', false),
  ('rocas',         'ASTEROIDS',     'SHOOTER', true),
  ('ranaria',       'RANARIA',       'ARCADE',  false),
  ('duelo-pixel',   'DUELO PIXEL',   'VERSUS',  false);
