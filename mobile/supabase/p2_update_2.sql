-- ═══════════════════════════════════════════════════════════════════════
-- Player 2 — update 2 (run ONCE in the Supabase SQL editor, after p2_schema.sql)
--
--   1) Profile photo walls (ordered array of public URLs) + telegram handle
--      (the handle links an app account to its website quiz answers).
--   2) Admin "Matchmaker" powers: the admin email can read every match &
--      questionnaire row and create/delete matches from inside the app.
--   3) Minigames: p2_games (games you curate on your profile) and
--      p2_game_plays (a match's playthrough of one of your games).
--   4) p2_messages learns kind='game_result' + a jsonb meta payload so game
--      results render as cards in the chat thread.
--
-- Everything below is idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1) profiles: photo wall + telegram ──────────────────────────────────
alter table public.p2_profiles
  add column if not exists photos text[] not null default '{}';
alter table public.p2_profiles
  add column if not exists telegram text;

-- ── 2) admin (matchmaker) policies ──────────────────────────────────────
-- The app hides these screens from everyone else; RLS enforces it for real.
drop policy if exists p2_matches_admin_select on public.p2_matches;
create policy p2_matches_admin_select on public.p2_matches
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com');

drop policy if exists p2_matches_admin_insert on public.p2_matches;
create policy p2_matches_admin_insert on public.p2_matches
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com');

drop policy if exists p2_matches_admin_update on public.p2_matches;
create policy p2_matches_admin_update on public.p2_matches
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com');

drop policy if exists p2_matches_admin_delete on public.p2_matches;
create policy p2_matches_admin_delete on public.p2_matches
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com');

-- The website's quiz table: INSERT-only for anon today; let the admin READ
-- applications inside the app (nobody else gains any access).
drop policy if exists questionnaire_admin_select on public.questionnaire;
create policy questionnaire_admin_select on public.questionnaire
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com');

-- ── 3) minigames ─────────────────────────────────────────────────────────
-- A game you curate on your profile. `items` is an ordered jsonb array of
--   { "prompt": string?, "options": string[], "answer": int }
-- where `answer` is YOUR side/truth (index into options):
--   • this_or_that → many items, options = [left, right]
--   • two_truths   → ONE item, options = 3 statements, answer = the lie
--   • guess_me     → many items, options = 2–4 choices, answer = the truth
create table if not exists public.p2_games (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.p2_profiles (id) on delete cascade,
  kind       text not null check (kind in ('this_or_that', 'two_truths', 'guess_me')),
  title      text not null,
  items      jsonb not null default '[]',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists p2_games_owner on public.p2_games (owner_id, created_at desc);

-- One playthrough of a game by the owner's match partner.
create table if not exists public.p2_game_plays (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.p2_games (id) on delete cascade,
  match_id   uuid not null references public.p2_matches (id) on delete cascade,
  player_id  uuid not null references public.p2_profiles (id) on delete cascade,
  answers    jsonb not null default '[]', -- picked option index per item
  score      int not null default 0,
  total      int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists p2_game_plays_match on public.p2_game_plays (match_id, created_at desc);
create index if not exists p2_game_plays_game on public.p2_game_plays (game_id, created_at desc);

-- Helper: is the signed-in user matched with `other`? SECURITY DEFINER so the
-- p2_games policy can consult p2_matches without tripping over its RLS.
create or replace function public.p2_is_matched_with(other uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.p2_matches m
    where (m.user_a = auth.uid() and m.user_b = other)
       or (m.user_b = auth.uid() and m.user_a = other)
  );
$$;

alter table public.p2_games      enable row level security;
alter table public.p2_game_plays enable row level security;

-- games: you manage your own; your matches can see your ACTIVE games.
drop policy if exists p2_games_select on public.p2_games;
create policy p2_games_select on public.p2_games
  for select to authenticated
  using (owner_id = auth.uid() or (is_active and public.p2_is_matched_with(owner_id)));

drop policy if exists p2_games_insert on public.p2_games;
create policy p2_games_insert on public.p2_games
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists p2_games_update on public.p2_games;
create policy p2_games_update on public.p2_games
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists p2_games_delete on public.p2_games;
create policy p2_games_delete on public.p2_games
  for delete to authenticated
  using (owner_id = auth.uid());

-- plays: both members of the match can read; you submit your own play.
drop policy if exists p2_game_plays_select on public.p2_game_plays;
create policy p2_game_plays_select on public.p2_game_plays
  for select to authenticated
  using (public.p2_is_match_member(match_id));

drop policy if exists p2_game_plays_insert on public.p2_game_plays;
create policy p2_game_plays_insert on public.p2_game_plays
  for insert to authenticated
  with check (player_id = auth.uid() and public.p2_is_match_member(match_id));

-- ── 4) messages: game-result cards ───────────────────────────────────────
alter table public.p2_messages drop constraint if exists p2_messages_kind_check;
alter table public.p2_messages
  add constraint p2_messages_kind_check
  check (kind in ('text', 'event_invite', 'game_result'));
alter table public.p2_messages
  add column if not exists meta jsonb;
