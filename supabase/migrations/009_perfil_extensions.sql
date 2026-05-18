-- Migration: Profile extensions for doctor profile page
-- Adds columns for photo, contact info, bio, social links, and professional license

-- =====================================================
-- 1. Add new columns to profiles table
-- =====================================================

alter table public.profiles
  add column if not exists foto_url text,
  add column if not exists telefono text,
  add column if not exists email_contacto text,
  add column if not exists numero_licencia text,
  add column if not exists bio text check (length(bio) <= 500),
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text,
  add column if not exists twitter_url text;

-- =====================================================
-- 2. Add comments for new columns
-- =====================================================

comment on column public.profiles.foto_url is 'URL to profile photo in Supabase Storage';
comment on column public.profiles.telefono is 'Phone number in Chilean format (+56 9 XXXX XXXX)';
comment on column public.profiles.email_contacto is 'Contact email (separate from auth email)';
comment on column public.profiles.numero_licencia is 'Professional license number';
comment on column public.profiles.bio is 'Professional bio/description (max 500 characters)';
comment on column public.profiles.linkedin_url is 'LinkedIn profile URL';
comment on column public.profiles.instagram_url is 'Instagram profile URL';
comment on column public.profiles.twitter_url is 'Twitter/X profile URL';

-- =====================================================
-- 3. Add indexes for frequently queried fields
-- =====================================================

create index if not exists idx_profiles_telefono
  on public.profiles(telefono);

create index if not exists idx_profiles_numero_licencia
  on public.profiles(numero_licencia);
