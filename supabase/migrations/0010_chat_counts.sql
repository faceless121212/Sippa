-- Fast per-character chat counts (Home "Staff picks" / "Just added" show how many chats each character has).
create index if not exists chats_character_idx on public.chats (character_id);
