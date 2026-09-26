-- Phase 3: chats, messages, memories, daily usage.
-- Users can READ their own chats/messages and manage their own memories.
-- Every message write goes through the server (service role), so users can't
-- forge assistant replies or bypass limits and safety checks.

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  summary text not null default '',
  summarized_upto bigint not null default 0, -- id of the last message folded into `summary`
  message_count integer not null default 0,
  last_message_preview text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chats_user_idx on public.chats (user_id, updated_at desc);

alter table public.chats enable row level security;
create policy "chats: read own" on public.chats for select using (auth.uid() = user_id);
create policy "chats: delete own" on public.chats for delete using (auth.uid() = user_id);
revoke insert, update on public.chats from anon, authenticated;

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  chat_id uuid not null references public.chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null check (char_length(content) <= 8000),
  rating smallint check (rating in (-1, 1)),
  flagged boolean not null default false,
  flag_reason text,
  created_at timestamptz not null default now()
);
create index if not exists messages_chat_idx on public.messages (chat_id, id);

alter table public.messages enable row level security;
create policy "messages: read own" on public.messages for select using (
  exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid())
);
revoke insert, update, delete on public.messages from anon, authenticated;

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists memories_chat_idx on public.memories (chat_id, created_at);

alter table public.memories enable row level security;
create policy "memories: read own" on public.memories for select using (
  exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid())
);
create policy "memories: add own" on public.memories for insert with check (
  exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid())
);
create policy "memories: delete own" on public.memories for delete using (
  exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid())
);

-- Free-plan daily message allowance (UTC days).
create table if not exists public.daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.daily_usage enable row level security;
create policy "daily_usage: read own" on public.daily_usage for select using (auth.uid() = user_id);

-- Atomically uses one message from today's allowance. Returns the new count,
-- or -1 when the limit is already reached. Server-only.
create or replace function public.consume_message(p_user uuid, p_limit integer)
returns integer language plpgsql security definer set search_path = public as $$
declare
  new_count integer;
begin
  insert into public.daily_usage (user_id, day, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set count = public.daily_usage.count + 1
    where public.daily_usage.count < p_limit
  returning count into new_count;
  return coalesce(new_count, -1);
end;
$$;
revoke execute on function public.consume_message(uuid, integer) from public, anon, authenticated;

create or replace function public.bump_character_messages(p_character text)
returns void language sql security definer set search_path = public as $$
  update public.characters set message_count = message_count + 1 where id = p_character;
$$;
revoke execute on function public.bump_character_messages(text) from public, anon, authenticated;
