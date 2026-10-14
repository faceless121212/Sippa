-- Memories belong to (user, character), not one chat, so every chat with a character
-- remembers. They are also filled automatically from conversation (source = 'auto').
alter table public.memories add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.memories add column if not exists character_id text references public.characters (id) on delete cascade;
alter table public.memories add column if not exists source text not null default 'user' check (source in ('user', 'auto'));
-- 'name' = what the user wants to be called (overrides the profile name in chats).
alter table public.memories add column if not exists kind text not null default 'fact' check (kind in ('fact', 'name'));

update public.memories m set user_id = c.user_id, character_id = c.character_id
from public.chats c where c.id = m.chat_id and (m.user_id is null or m.character_id is null);

alter table public.memories alter column user_id set not null;
alter table public.memories alter column character_id set not null;
alter table public.memories alter column chat_id drop not null;
alter table public.memories drop constraint if exists memories_chat_id_fkey;
alter table public.memories add constraint memories_chat_id_fkey
  foreign key (chat_id) references public.chats (id) on delete set null;

create index if not exists memories_user_character_idx on public.memories (user_id, character_id, created_at);

drop policy if exists "memories: read own" on public.memories;
drop policy if exists "memories: add own" on public.memories;
drop policy if exists "memories: delete own" on public.memories;
create policy "memories: read own" on public.memories for select using (auth.uid() = user_id);
create policy "memories: add own" on public.memories for insert with check (
  auth.uid() = user_id and source = 'user'
  and (chat_id is null or exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()))
);
create policy "memories: delete own" on public.memories for delete using (auth.uid() = user_id);
