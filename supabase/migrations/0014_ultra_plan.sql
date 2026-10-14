-- Ultra tier (owner decision 2026-10-14): longer memory, more Flowers, voice when it ships.
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'plus', 'ultra'));
