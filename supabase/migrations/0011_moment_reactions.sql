-- Characters react to each other's moments (likes and short in-character replies).
-- These are AI characters interacting in public: they are shown separately from
-- real user likes and are never added to moments.like_count.
create table if not exists public.moment_reactions (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  kind text not null check (kind in ('like', 'reply')),
  text text check (
    (kind = 'like' and text is null) or (kind = 'reply' and char_length(text) between 1 and 300)
  ),
  created_at timestamptz not null default now(),
  unique (moment_id, character_id, kind)
);
create index if not exists moment_reactions_moment_idx on public.moment_reactions (moment_id, created_at);
alter table public.moment_reactions enable row level security;

-- Visible only when both the moment's character and the reacting character are
-- visible to the viewer (the characters table's own RLS applies inside EXISTS).
create policy "moment_reactions: read visible" on public.moment_reactions for select using (
  exists (select 1 from public.characters c where c.id = character_id)
  and exists (
    select 1 from public.moments m join public.characters mc on mc.id = m.character_id
    where m.id = moment_id
  )
);
-- Written only by the server (service role).
revoke insert, update, delete on public.moment_reactions from anon, authenticated;
