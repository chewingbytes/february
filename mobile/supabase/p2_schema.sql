-- ═══════════════════════════════════════════════════════════════════════
-- Player 2 mobile app — schema (run in the Supabase SQL editor)
--
-- IMPORTANT: this Supabase instance is SHARED with other apps (meetup2 has
-- its own profiles/events/messages tables), so every table here is
-- namespaced with `p2_`. Nothing below touches existing tables.
--
-- Order of operations:
--   1) Run this whole file once.
--   2) Sign in on the app with bryanchewzy24@gmail.com (creates your
--      p2_profiles row).
--   3) Run the SEED block at the bottom to drop the pilot-night pin.
-- ═══════════════════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────────────────
create table if not exists public.p2_profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  display_name  text not null default '',
  avatar_url    text,
  status_bubble text not null default '',
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ── matches (created by the founder after Thursday pairing) ─────────────
create table if not exists public.p2_matches (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references public.p2_profiles (id) on delete cascade,
  user_b        uuid not null references public.p2_profiles (id) on delete cascade,
  compatibility int  not null default 90 check (compatibility between 0 and 100),
  created_at    timestamptz not null default now(),
  check (user_a <> user_b)
);

-- one match per pair, whichever order the founder inserts them in
create unique index if not exists p2_matches_pair_uniq
  on public.p2_matches (least(user_a, user_b), greatest(user_a, user_b));

-- ── events (map pins; admin-only writes) ────────────────────────────────
create table if not exists public.p2_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  venue       text not null,
  lat         double precision not null,
  lng         double precision not null,
  starts_at   timestamptz not null,
  created_by  uuid references public.p2_profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ── messages (realtime chat; also carries event invites) ────────────────
create table if not exists public.p2_messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.p2_matches (id) on delete cascade,
  sender_id  uuid not null references public.p2_profiles (id) on delete cascade,
  content    text not null default '',
  kind       text not null default 'text' check (kind in ('text', 'event_invite')),
  event_id   uuid references public.p2_events (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

create index if not exists p2_messages_match_created
  on public.p2_messages (match_id, created_at desc);
create index if not exists p2_messages_unread
  on public.p2_messages (match_id) where read_at is null;

-- ── event joins (the both-agree flow) ───────────────────────────────────
-- One row per (event, match). The suggester creates it as `pending`
-- (their agreement is implicit); the partner flips it to `accepted`
-- (both in) or `declined`.
create table if not exists public.p2_event_joins (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.p2_events (id) on delete cascade,
  match_id     uuid not null references public.p2_matches (id) on delete cascade,
  requested_by uuid not null references public.p2_profiles (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  unique (event_id, match_id)
);

-- ── helper: am I one half of this match? ────────────────────────────────
-- SECURITY DEFINER so policies can consult p2_matches without recursive RLS.
create or replace function public.p2_is_match_member(mid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.p2_matches m
    where m.id = mid
      and auth.uid() in (m.user_a, m.user_b)
  );
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.p2_profiles    enable row level security;
alter table public.p2_matches     enable row level security;
alter table public.p2_events      enable row level security;
alter table public.p2_messages    enable row level security;
alter table public.p2_event_joins enable row level security;

-- profiles: any signed-in user can read (needed to render partners),
-- but you can only create/update your own row.
drop policy if exists p2_profiles_select on public.p2_profiles;
create policy p2_profiles_select on public.p2_profiles
  for select to authenticated using (true);

drop policy if exists p2_profiles_insert on public.p2_profiles;
create policy p2_profiles_insert on public.p2_profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists p2_profiles_update on public.p2_profiles;
create policy p2_profiles_update on public.p2_profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- matches: visible only to their two members. No client INSERT policy —
-- the founder creates matches from the dashboard (service role).
drop policy if exists p2_matches_select on public.p2_matches;
create policy p2_matches_select on public.p2_matches
  for select to authenticated
  using (auth.uid() in (user_a, user_b));

-- events: everyone signed-in can read; only the admin email can write.
drop policy if exists p2_events_select on public.p2_events;
create policy p2_events_select on public.p2_events
  for select to authenticated using (true);

drop policy if exists p2_events_insert on public.p2_events;
create policy p2_events_insert on public.p2_events
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com');

drop policy if exists p2_events_update on public.p2_events;
create policy p2_events_update on public.p2_events
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com');

drop policy if exists p2_events_delete on public.p2_events;
create policy p2_events_delete on public.p2_events
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'bryanchewzy24@gmail.com');

-- messages: only the two match members can read; you can only send as
-- yourself into your own match; members may update (read receipts).
drop policy if exists p2_messages_select on public.p2_messages;
create policy p2_messages_select on public.p2_messages
  for select to authenticated
  using (public.p2_is_match_member(match_id));

drop policy if exists p2_messages_insert on public.p2_messages;
create policy p2_messages_insert on public.p2_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.p2_is_match_member(match_id));

drop policy if exists p2_messages_update on public.p2_messages;
create policy p2_messages_update on public.p2_messages
  for update to authenticated
  using (public.p2_is_match_member(match_id))
  with check (public.p2_is_match_member(match_id));

-- event joins: readable by any signed-in user (powers "3 pairs are in");
-- writable only by the two members of the match involved.
drop policy if exists p2_event_joins_select on public.p2_event_joins;
create policy p2_event_joins_select on public.p2_event_joins
  for select to authenticated using (true);

drop policy if exists p2_event_joins_insert on public.p2_event_joins;
create policy p2_event_joins_insert on public.p2_event_joins
  for insert to authenticated
  with check (requested_by = auth.uid() and public.p2_is_match_member(match_id));

drop policy if exists p2_event_joins_update on public.p2_event_joins;
create policy p2_event_joins_update on public.p2_event_joins
  for update to authenticated
  using (public.p2_is_match_member(match_id))
  with check (public.p2_is_match_member(match_id));

-- ── realtime ─────────────────────────────────────────────────────────────
-- Add the tables to the realtime publication (idempotent).
do $$
declare t text;
begin
  foreach t in array array['p2_messages', 'p2_matches', 'p2_events', 'p2_event_joins']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- SEED — run AFTER signing into the app once with bryanchewzy24@gmail.com
-- (the insert is skipped silently if that profile doesn't exist yet).
-- Pilot night: King and the Pawn, 17 Purvis St — Sat 11 Jul 2026, 7pm SGT.
-- ═══════════════════════════════════════════════════════════════════════
insert into public.p2_events (title, description, venue, lat, lng, starts_at, created_by)
select
  'Pilot Game Night',
  'Our very first hosted night — four matched pairs, one table, and Chloe running the room. Completely free.',
  'King and the Pawn, 17 Purvis St, #01-01',
  1.29661,
  103.85457,
  '2026-07-11 19:00:00+08',
  p.id
from public.p2_profiles p
where p.email = 'bryanchewzy24@gmail.com'
  and not exists (select 1 from public.p2_events where title = 'Pilot Game Night');

-- ── OPTIONAL: create a test match between two signed-in users ───────────
-- (both people must have opened the app once; replace the second email)
-- insert into public.p2_matches (user_a, user_b, compatibility)
-- select a.id, b.id, 92
-- from public.p2_profiles a, public.p2_profiles b
-- where a.email = 'bryanchewzy24@gmail.com'
--   and b.email = 'friend@example.com'
-- on conflict do nothing;
