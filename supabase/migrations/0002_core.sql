-- Phase 2: profiles, characters, favorites, reports.
-- RLS is enabled on every table. Anything that changes plan, beans, age or
-- admin status goes through the server with the service role — never the client.

-- ─────────────────────────── profiles ───────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text check (char_length(display_name) <= 40),
  dob date,
  is_adult boolean not null default false,
  age_verified_at timestamptz, -- hook for real age verification later (DECISIONS: flagged)
  plan text not null default 'free' check (plan in ('free', 'plus')),
  beans integer not null default 0 check (beans >= 0),
  free_creations_used integer not null default 0,
  is_admin boolean not null default false,
  banned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

-- Users may only change their display name. Everything else is server-only.
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by policies: is the current user a verified adult?
create or replace function public.current_user_is_adult()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_adult and banned_at is null from public.profiles where id = auth.uid()), false);
$$;

-- ─────────────────────────── characters ───────────────────────────
create table if not exists public.characters (
  id text primary key check (id ~ '^[a-z0-9-]{2,64}$'),
  creator_id uuid references auth.users (id) on delete set null, -- null = official Sippa character
  name text not null check (char_length(name) between 1 and 60),
  category text not null check (category in ('lover', 'friend', 'famous')),
  famous_type text check (famous_type in ('historical', 'inspired', 'verified_creator')),
  gender text not null check (gender in ('male', 'female', 'nonbinary')),
  age integer check (age is null or age >= 18),
  hook text not null check (char_length(hook) <= 90),
  description text not null default '',
  personality jsonb not null default '{}'::jsonb,
  speaking_style text not null default '',
  backstory text not null default '',
  first_message text not null default '',
  example_dialogues jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  avatar_url text,
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'hidden')),
  message_count bigint not null default 0,
  trending_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Spec §6.1: every romantic character is a stated adult aged 21+.
  constraint lover_is_21_plus check (category <> 'lover' or (age is not null and age >= 21)),
  -- Spec §6.3: famous characters must declare which allowed type they are.
  constraint famous_has_type check (category <> 'famous' or famous_type is not null)
);

create index if not exists characters_category_idx on public.characters (category, message_count desc);
create index if not exists characters_trending_idx on public.characters (trending_score desc);
create index if not exists characters_tags_idx on public.characters using gin (tags);
create index if not exists characters_search_idx on public.characters
  using gin (to_tsvector('simple', name || ' ' || hook || ' ' || array_to_string(tags, ' ')));

alter table public.characters enable row level security;

-- Anyone (even signed out) can see approved public/unlisted characters,
-- except Lover characters, which require a verified adult. Creators always see their own.
create policy "characters: read visible" on public.characters
  for select using (
    (
      status = 'approved'
      and visibility in ('public', 'unlisted')
      and (category <> 'lover' or public.current_user_is_adult())
    )
    or creator_id = auth.uid()
  );

-- Writes happen through server routes (Phase 4 creator + moderation).
revoke insert, update, delete on public.characters from anon, authenticated;

-- ─────────────────────────── favorites ───────────────────────────
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, character_id)
);

alter table public.favorites enable row level security;
create policy "favorites: read own" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites: add own" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites: remove own" on public.favorites for delete using (auth.uid() = user_id);

-- ─────────────────────────── reports ───────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  target_type text not null check (target_type in ('character', 'message', 'user')),
  target_id text not null,
  reason text not null check (reason in ('minor', 'real_person', 'sexual', 'hate', 'self_harm', 'spam', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'auto_hidden', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;
-- Signed-in users can file reports and see their own; the admin queue (Phase 6) uses the service role.
create policy "reports: file" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "reports: read own" on public.reports for select using (auth.uid() = reporter_id);
