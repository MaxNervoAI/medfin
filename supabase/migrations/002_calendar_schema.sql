-- =====================================================
-- MEDFIN - Calendar Feature Schema
-- =====================================================

-- Enable btree_gist extension for UUID exclusion constraints
create extension if not exists btree_gist;

-- =====================================================
-- Appointments Table
-- =====================================================
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  institucion_id uuid references public.instituciones(id) on delete set null,
  titulo text not null,
  descripcion text,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null,
  estado text default 'programada', -- programada, completada, cancelada
  notas text,
  archivo_boleta_url text, -- URL of attached boleta/factura file
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Constraint: end time must be after start time
  check (fecha_fin > fecha_inicio)
);

-- RLS: each user only sees their own appointments
alter table public.appointments enable row level security;
create policy "citas propias" on public.appointments
  for all using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger appointments_updated_at
  before update on public.appointments
  for each row execute procedure public.set_updated_at();

-- =====================================================
-- Prestaciones Citas Junction Table
-- =====================================================
create table public.prestaciones_citas (
  cita_id uuid references public.appointments(id) on delete cascade not null,
  prestacion_id uuid references public.prestaciones(id) on delete cascade not null,
  created_at timestamptz default now(),
  
  primary key (cita_id, prestacion_id)
);

-- RLS: each user only sees their own junctions
alter table public.prestaciones_citas enable row level security;
create policy "prestaciones_citas propias" on public.prestaciones_citas
  for all using (
    auth.uid() in (
      select user_id from public.appointments where id = prestaciones_citas.cita_id
    )
  );

-- =====================================================
-- Performance Indexes
-- =====================================================
-- Index for user's appointments by date range
create index idx_appointments_user_fecha on public.appointments(user_id, fecha_inicio, fecha_fin);

-- Index for user's appointments by status
create index idx_appointments_user_estado on public.appointments(user_id, estado);

-- Index for user's appointments by institution
create index idx_appointments_user_institucion on public.appointments(user_id, institucion_id);

-- Index for prestaciones_citas
create index idx_prestaciones_citas_cita on public.prestaciones_citas(cita_id);
create index idx_prestaciones_citas_prestacion on public.prestaciones_citas(prestacion_id);

-- =====================================================
-- Exclusion Constraint for Overlapping Appointments
-- =====================================================
-- Prevent overlapping appointments for the same user
-- This uses GiST index for temporal data with btree for UUID
alter table public.appointments
add constraint no_overlapping_appointments
exclude using gist (
  user_id with =,
  tstzrange(fecha_inicio, fecha_fin) with &&
) where (estado != 'cancelada');

-- =====================================================
-- Comments
-- =====================================================
comment on table public.appointments is 'Citas y appointments para el calendario';
comment on column public.appointments.estado is 'Estado de la cita: programada, completada, cancelada';
comment on table public.prestaciones_citas is 'Tabla de unión entre citas y prestaciones para seguimiento financiero';
