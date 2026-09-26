-- Characters occasionally "write to you" (owner request): short check-ins
-- shown as an in-app popup every 3–4 minutes. Server-only writes; users can
-- turn them off.

alter table public.profiles add column if not exists nudges_enabled boolean not null default true;
grant update (nudges_enabled) on public.profiles to authenticated;

create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  text text not null check (char_length(text) <= 400),
  created_at timestamptz not null default now(),
  used_at timestamptz
);
create index if not exists nudges_user_idx on public.nudges (user_id, created_at desc);
alter table public.nudges enable row level security;
create policy "nudges: read own" on public.nudges for select using (auth.uid() = user_id);
revoke insert, update, delete on public.nudges from anon, authenticated;
