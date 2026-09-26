-- Public bucket for user-created character portraits.
-- Anyone can read (they're shown on character cards); only the server
-- (service role) writes, after moderation.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
