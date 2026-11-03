create table public.plays (
  id         uuid primary key default gen_random_uuid(),
  game_id    text not null references public.games(id),
  created_at timestamptz not null default now()
);

create index plays_game_idx on public.plays (game_id);

alter table public.plays enable row level security;

grant select, insert on public.plays to anon, authenticated;

create policy "plays_select_all" on public.plays
  for select to anon, authenticated
  using (true);

create policy "plays_insert_playable" on public.plays
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.games g
      where g.id = game_id and g.playable
    )
  );
