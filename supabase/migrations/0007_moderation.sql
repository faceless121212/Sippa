-- Phase 6: moderation queue + audit log.
-- Admin actions go through the server (service role) after an is_admin check;
-- every one is written to audit_log. Nobody can read these with the anon key.

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null, -- null = automated system
  action text not null,
  target_type text not null,
  target_id text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;

alter table public.reports add column if not exists auto_verdict jsonb;
alter table public.reports add column if not exists resolved_by uuid references auth.users (id) on delete set null;
alter table public.reports add column if not exists resolved_at timestamptz;
create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.characters add column if not exists moderation_note text;
create index if not exists characters_pending_idx on public.characters (status) where status = 'pending';
