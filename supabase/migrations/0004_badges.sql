-- Curated badges shown on character cards ('new', 'pick').
-- 'Hot' and 'Trending' are computed from message_count / trending_score.
alter table public.characters
  add column if not exists badges text[] not null default '{}'
  check (badges <@ array['new', 'pick']::text[]);
create index if not exists characters_badges_idx on public.characters using gin (badges);
