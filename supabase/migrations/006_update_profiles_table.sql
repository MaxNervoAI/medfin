-- Migration: Update profiles table to include additional fields
-- Adds profession, rut, city to existing profiles table
-- Removes the conflicting user_profiles table

-- =====================================================
-- 1. Add new columns to profiles table
-- =====================================================

alter table public.profiles
  add column if not exists profession text,
  add column if not exists rut text unique,
  add column if not exists city text,
  add column if not exists updated_at timestamptz default now();

-- =====================================================
-- 2. Update trigger to include new fields
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email
  );
  return new;
end;
$$;

-- =====================================================
-- 3. Drop conflicting user_profiles table
-- =====================================================

drop table if exists public.user_profiles cascade;

-- =====================================================
-- 4. Update RLS policies for profiles
-- =====================================================

drop policy if exists "perfil propio" on public.profiles;

create policy "users_can_read_own_profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "users_can_update_own_profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =====================================================
-- 5. Add updated_at trigger
-- =====================================================

create or replace function public.update_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_profiles_updated_at on public.profiles;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_profiles_updated_at();

-- =====================================================
-- 6. Create index for rut lookups
-- =====================================================

create index if not exists idx_profiles_rut
  on public.profiles(rut);

comment on table public.profiles is
  'Extended user profile information linked to Supabase Auth users. Includes nombre, email, especialidad, profession, rut, city.';
