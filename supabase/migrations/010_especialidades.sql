-- Migration: Especialidades (Specialties) tables
-- Creates specialties table and junction table for profile-specialty relationships

-- =====================================================
-- 1. Create especialidades enum type
-- =====================================================

create type especialidad_tipo as enum ('medica', 'psicologica', 'personalizada');

-- =====================================================
-- 2. Create especialidades table
-- =====================================================

create table if not exists public.especialidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo especialidad_tipo not null default 'personalizada',
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for tipo filtering
create index if not exists idx_especialidades_tipo
  on public.especialidades(tipo);

-- Index for active specialties
create index if not exists idx_especialidades_activa
  on public.especialidades(activa);

comment on table public.especialidades is
  'Medical and psychological specialties for doctors. Includes predefined Chilean specialties and custom user-added specialties.';

comment on column public.especialidades.tipo is
  'Type of specialty: medica (Chilean medical specialties), psicologica (psychology), personalizada (user-added custom specialties)';

-- =====================================================
-- 3. Create perfil_especialidades junction table
-- =====================================================

create table if not exists public.perfil_especialidades (
  perfil_id uuid not null references public.profiles(id) on delete cascade,
  especialidad_id uuid not null references public.especialidades(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (perfil_id, especialidad_id)
);

-- Index for perfil lookups
create index if not exists idx_perfil_especialidades_perfil
  on public.perfil_especialidades(perfil_id);

-- Index for especialidad lookups
create index if not exists idx_perfil_especialidades_especialidad
  on public.perfil_especialidades(especialidad_id);

comment on table public.perfil_especialidades is
  'Many-to-many relationship between profiles and specialties. Allows doctors to have multiple specialties.';

-- =====================================================
-- 4. RLS for especialidades table
-- =====================================================

alter table public.especialidades enable row level security;

-- Authenticated users can read all specialties
create policy "authenticated_can_read_especialidades"
  on public.especialidades
  for select
  to authenticated
  using (true);

-- No insert/update/delete policies for regular users (admin only via service role)

-- =====================================================
-- 5. RLS for perfil_especialidades junction table
-- =====================================================

alter table public.perfil_especialidades enable row level security;

-- Users can read their own profile's specialties
create policy "users_can_read_own_especialidades"
  on public.perfil_especialidades
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = perfil_especialidades.perfil_id
      and profiles.id = auth.uid()
    )
  );

-- Users can insert specialties for their own profile
create policy "users_can_insert_own_especialidades"
  on public.perfil_especialidades
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = perfil_especialidades.perfil_id
      and profiles.id = auth.uid()
    )
  );

-- Users can delete specialties from their own profile
create policy "users_can_delete_own_especialidades"
  on public.perfil_especialidades
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = perfil_especialidades.perfil_id
      and profiles.id = auth.uid()
    )
  );

-- =====================================================
-- 6. Update updated_at trigger for especialidades
-- =====================================================

create or replace function public.update_especialidades_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_especialidades_updated_at on public.especialidades;

create trigger update_especialidades_updated_at
  before update on public.especialidades
  for each row execute function public.update_especialidades_updated_at();
