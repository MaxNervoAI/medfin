-- =====================================================
-- MEDFIN - Schema inicial
-- =====================================================

-- Tabla de perfiles (extiende auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text,
  email text,
  especialidad text,
  created_at timestamptz default now()
);

-- RLS: cada usuario solo ve su propio perfil
alter table public.profiles enable row level security;
create policy "perfil propio" on public.profiles
  for all using (auth.uid() = id);

-- Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
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
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- Instituciones (clínicas / hospitales)
-- =====================================================
create table public.instituciones (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  nombre text not null,
  rut text,
  activa boolean default true,
  created_at timestamptz default now()
);

alter table public.instituciones enable row level security;
create policy "instituciones propias" on public.instituciones
  for all using (auth.uid() = user_id);

-- =====================================================
-- Tipos de prestación
-- =====================================================
create table public.tipos_prestacion (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  nombre text not null,          -- ej: "Endoscopia", "Cirugía", "Turno"
  es_turno boolean default false, -- si es turno, el monto = horas * valor_hora
  created_at timestamptz default now()
);

alter table public.tipos_prestacion enable row level security;
create policy "tipos propios" on public.tipos_prestacion
  for all using (auth.uid() = user_id);

-- =====================================================
-- Reglas de plazo (por institución + tipo de prestación)
-- =====================================================
create table public.reglas_plazo (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  institucion_id uuid references public.instituciones(id) on delete cascade not null,
  tipo_prestacion_nombre text not null, -- guardamos el nombre para flexibilidad
  dias_emitir_boleta int not null default 5,   -- días desde prestación para emitir boleta
  dias_recibir_pago int not null default 30,   -- días desde boleta emitida para recibir pago
  created_at timestamptz default now(),
  unique(institucion_id, tipo_prestacion_nombre)
);

alter table public.reglas_plazo enable row level security;
create policy "reglas propias" on public.reglas_plazo
  for all using (auth.uid() = user_id);

-- =====================================================
-- Prestaciones registradas
-- =====================================================
create type public.estado_prestacion as enum (
  'realizada',      -- registrada, boleta pendiente de emitir
  'boleta_emitida', -- boleta/factura enviada al SII, esperando pago
  'pagada'          -- pago recibido
);

create type public.tipo_documento as enum ('boleta', 'factura');

create table public.prestaciones (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  institucion_id uuid references public.instituciones(id) on delete set null,
  institucion_nombre text not null,       -- desnormalizado para historial
  tipo_prestacion text not null,          -- nombre del tipo
  es_turno boolean default false,

  -- Fechas
  fecha_prestacion date not null,
  fecha_limite_boleta date,               -- calculado: fecha_prestacion + dias_emitir_boleta
  fecha_boleta_emitida date,              -- cuando el profesional marcó la boleta como emitida
  fecha_limite_pago date,                 -- calculado: fecha_boleta_emitida + dias_recibir_pago
  fecha_pago_recibido date,               -- cuando llegó el pago

  -- Montos
  monto_bruto numeric(12,2) not null,
  retencion_pct numeric(5,2) default 14.5,
  monto_retencion numeric(12,2) generated always as (round(monto_bruto * retencion_pct / 100, 2)) stored,
  monto_neto numeric(12,2) generated always as (round(monto_bruto * (1 - retencion_pct / 100), 2)) stored,

  -- Para turnos
  horas numeric(5,2),
  valor_hora numeric(12,2),

  -- Estado y documento
  estado public.estado_prestacion default 'realizada',
  tipo_documento public.tipo_documento default 'boleta',
  numero_documento text,                  -- número de boleta/factura (opcional)

  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prestaciones enable row level security;
create policy "prestaciones propias" on public.prestaciones
  for all using (auth.uid() = user_id);

-- Trigger para updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger prestaciones_updated_at
  before update on public.prestaciones
  for each row execute procedure public.set_updated_at();

-- =====================================================
-- Índices útiles
-- =====================================================
create index idx_prestaciones_user_estado on public.prestaciones(user_id, estado);
create index idx_prestaciones_user_fecha on public.prestaciones(user_id, fecha_prestacion);
create index idx_prestaciones_fecha_limite_boleta on public.prestaciones(user_id, fecha_limite_boleta) where estado = 'realizada';
