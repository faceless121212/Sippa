-- Phase 5: Stripe billing, Sippa Plus and Beans.
-- Plan and balance change only through server code (service role) after
-- Stripe confirms payment. Every Beans change is a ledger row.

alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists plus_until timestamptz;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('beans_pack', 'plus_bonus', 'spend', 'refund', 'adjustment')),
  beans integer not null,               -- +credit / -debit
  amount_cents integer,                 -- money paid, if any
  currency text,
  reason text,                          -- e.g. 'creation', 'message'
  stripe_id text unique,                -- checkout session / invoice id: makes grants idempotent
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;
create policy "transactions: read own" on public.transactions for select using (auth.uid() = user_id);
revoke insert, update, delete on public.transactions from anon, authenticated;

-- Credit Beans once per Stripe object. Returns false if already credited.
create or replace function public.grant_beans(
  p_user uuid, p_beans integer, p_type text, p_stripe_id text, p_amount_cents integer, p_currency text
) returns boolean language plpgsql security definer set search_path = public as $$
declare inserted uuid;
begin
  insert into public.transactions (user_id, type, beans, amount_cents, currency, stripe_id)
  values (p_user, p_type, p_beans, p_amount_cents, p_currency, p_stripe_id)
  on conflict (stripe_id) do nothing
  returning id into inserted;
  if inserted is null then return false; end if;
  update public.profiles set beans = beans + p_beans where id = p_user;
  return true;
end;
$$;

-- Atomically spend Beans. Returns the new balance, or -1 if not enough.
create or replace function public.spend_beans(p_user uuid, p_beans integer, p_reason text)
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if p_beans <= 0 then return -1; end if;
  update public.profiles set beans = beans - p_beans
  where id = p_user and beans >= p_beans
  returning beans into new_balance;
  if new_balance is null then return -1; end if;
  insert into public.transactions (user_id, type, beans, reason) values (p_user, 'spend', -p_beans, p_reason);
  return new_balance;
end;
$$;

revoke execute on function public.grant_beans(uuid, integer, text, text, integer, text) from public, anon, authenticated;
revoke execute on function public.spend_beans(uuid, integer, text) from public, anon, authenticated;
