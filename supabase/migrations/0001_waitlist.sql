-- Waitlist sign-ups from the landing page.
-- Written only by the server (service role). RLS is enabled with no policies,
-- so anon/authenticated clients can neither read nor write it.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and char_length(email) <= 254),
  consent boolean not null check (consent),
  source text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
