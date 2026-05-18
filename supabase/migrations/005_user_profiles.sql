-- Migration: User profiles table
-- Stores additional user information beyond what Supabase Auth provides

-- =====================================================
-- 1. user_profiles table
-- =====================================================

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  profession text,
  rut text unique,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for RUT lookups
create index if not exists idx_user_profiles_rut
  on public.user_profiles(rut);

-- Index for email lookups
create index if not exists idx_user_profiles_email
  on public.user_profiles(email);

comment on table public.user_profiles is
  'Extended user profile information linked to Supabase Auth users.';

-- =====================================================
-- 2. RLS: users can read/update own profile
-- =====================================================

alter table public.user_profiles enable row level security;

create policy "users_can_read_own_profile"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "users_can_update_own_profile"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =====================================================
-- 3. Auto-create profile trigger on user signup
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user() is
  'Auto-creates user profile entry when a new user signs up via Supabase Auth.';

-- =====================================================
-- 4. Update updated_at timestamp
-- =====================================================

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_user_profiles_updated_at on public.user_profiles;

create trigger update_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.update_updated_at_column();
