-- Speed audit 2026-09-28: indexes for common filters and sorts.
create index if not exists characters_creator_idx on public.characters (creator_id) where creator_id is not null;
create index if not exists characters_popular_idx on public.characters (message_count desc) where status = 'approved' and visibility = 'public';
create index if not exists moment_likes_user_idx on public.moment_likes (user_id, moment_id);
