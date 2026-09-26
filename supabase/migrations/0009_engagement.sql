-- Engagement mechanics (owner picks 2026-09-26): gifts, bond levels, daily
-- check-in, scene starters, character moments, likes & creator stats.
-- Everything that grants XP or Flowers is server-only.

-- Ledger: allow bonus (check-in) and gift entries.
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in ('beans_pack', 'plus_bonus', 'spend', 'refund', 'adjustment', 'bonus'));

-- ── Bond levels (per user × character) ──
create table if not exists public.bonds (
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  gifts integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, character_id)
);
alter table public.bonds enable row level security;
create policy "bonds: read own" on public.bonds for select using (auth.uid() = user_id);
revoke insert, update, delete on public.bonds from anon, authenticated;

create or replace function public.add_bond_xp(p_user uuid, p_character text, p_xp integer, p_gift integer default 0)
returns integer language plpgsql security definer set search_path = public as $$
declare new_xp integer;
begin
  insert into public.bonds (user_id, character_id, xp, gifts)
  values (p_user, p_character, greatest(p_xp, 0), greatest(p_gift, 0))
  on conflict (user_id, character_id) do update
    set xp = public.bonds.xp + greatest(p_xp, 0),
        gifts = public.bonds.gifts + greatest(p_gift, 0),
        updated_at = now()
  returning xp into new_xp;
  return new_xp;
end;
$$;
revoke execute on function public.add_bond_xp(uuid, text, integer, integer) from public, anon, authenticated;

-- ── Daily check-in ──
create table if not exists public.checkins (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  streak integer not null,
  primary key (user_id, day)
);
alter table public.checkins enable row level security;
create policy "checkins: read own" on public.checkins for select using (auth.uid() = user_id);
revoke insert, update, delete on public.checkins from anon, authenticated;

-- ── Scenes ──
alter table public.chats add column if not exists scene text;

-- ── Character moments feed ──
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  character_id text not null references public.characters (id) on delete cascade,
  text text not null check (char_length(text) <= 400),
  created_at timestamptz not null default now()
);
create index if not exists moments_created_idx on public.moments (created_at desc);
create index if not exists moments_character_idx on public.moments (character_id, created_at desc);
alter table public.moments enable row level security;
-- Moments are public for characters the viewer may see (same rule as characters).
create policy "moments: read visible" on public.moments for select using (
  exists (select 1 from public.characters c where c.id = character_id)
);
revoke insert, update, delete on public.moments from anon, authenticated;

create table if not exists public.moment_likes (
  moment_id uuid not null references public.moments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, user_id)
);
alter table public.moment_likes enable row level security;
create policy "moment_likes: read own" on public.moment_likes for select using (auth.uid() = user_id);
create policy "moment_likes: add own" on public.moment_likes for insert with check (auth.uid() = user_id);
create policy "moment_likes: remove own" on public.moment_likes for delete using (auth.uid() = user_id);
alter table public.moments add column if not exists like_count integer not null default 0;

-- ── Likes on characters (favourites double as likes) ──
alter table public.characters add column if not exists like_count integer not null default 0;
update public.characters c set like_count = (select count(*) from public.favorites f where f.character_id = c.id);

create or replace function public.sync_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'favorites' then
    update public.characters set like_count = like_count + (case when tg_op = 'INSERT' then 1 else -1 end)
    where id = coalesce(new.character_id, old.character_id);
  else
    update public.moments set like_count = like_count + (case when tg_op = 'INSERT' then 1 else -1 end)
    where id = coalesce(new.moment_id, old.moment_id);
  end if;
  return null;
end;
$$;
drop trigger if exists favorites_like_count on public.favorites;
create trigger favorites_like_count after insert or delete on public.favorites
  for each row execute function public.sync_like_count();
drop trigger if exists moment_likes_count on public.moment_likes;
create trigger moment_likes_count after insert or delete on public.moment_likes
  for each row execute function public.sync_like_count();

-- Creator leaderboard (public, display names only; approved public characters only).
create or replace view public.top_creators with (security_invoker = false) as
  select p.id as creator_id,
         coalesce(nullif(p.display_name, ''), 'Anonymous creator') as name,
         count(c.id)::int as characters,
         coalesce(sum(c.like_count), 0)::int as likes,
         coalesce(sum(c.message_count), 0)::bigint as messages
  from public.characters c
  join public.profiles p on p.id = c.creator_id
  where c.status = 'approved' and c.visibility = 'public' and p.banned_at is null
  group by p.id, p.display_name;
revoke all on public.top_creators from anon, authenticated;
