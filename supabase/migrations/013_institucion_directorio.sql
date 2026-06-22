-- =====================================================
-- EPIC-013: Directorio compartido de instituciones chilenas
-- =====================================================

-- 1. Shared institution directory table
create table if not exists public.instituciones_directorio (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  rut        text,
  ciudad     text,
  region     text,
  tipo       text not null default 'otro'
               check (tipo in ('hospital_publico','clinica_privada','centro_medico','red_medica','otro')),
  verificada boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_directorio_nombre_text
  on public.instituciones_directorio (nombre);

-- 2. RLS: all authenticated users can read; any authenticated user can insert (community suggestion)
alter table public.instituciones_directorio enable row level security;

create policy "directorio_read_all"
  on public.instituciones_directorio for select
  to authenticated
  using (true);

create policy "directorio_insert_any"
  on public.instituciones_directorio for insert
  to authenticated
  with check (true);

-- 3. Link user instituciones to the directory
alter table public.instituciones
  add column if not exists directorio_id uuid
    references public.instituciones_directorio(id) on delete set null;

create index if not exists idx_instituciones_directorio_id
  on public.instituciones(directorio_id);

-- =====================================================
-- 4. Seed: ~40 verified Chilean healthcare institutions
-- =====================================================
insert into public.instituciones_directorio
  (nombre, rut, ciudad, region, tipo, verificada)
values
  -- Clínicas privadas — Santiago
  ('Clínica Las Condes',                    '96.502.530-K', 'Las Condes',     'Metropolitana',    'clinica_privada',  true),
  ('Clínica Alemana de Santiago',           '96.535.760-8', 'Vitacura',       'Metropolitana',    'clinica_privada',  true),
  ('Clínica Bupa Santiago',                 '96.702.110-K', 'Providencia',    'Metropolitana',    'clinica_privada',  true),
  ('Clínica UC San Carlos de Apoquindo',    '81.669.600-6', 'Las Condes',     'Metropolitana',    'clinica_privada',  true),
  ('Clínica Indisa',                        '96.542.550-7', 'Providencia',    'Metropolitana',    'clinica_privada',  true),
  ('Clínica Dávila',                        '96.619.420-4', 'Independencia',  'Metropolitana',    'clinica_privada',  true),
  ('Clínica Bicentenario',                  '76.164.502-1', 'Las Condes',     'Metropolitana',    'clinica_privada',  true),
  ('Clínica Tabancura',                     '96.547.720-1', 'Vitacura',       'Metropolitana',    'clinica_privada',  true),
  ('Clínica Avansalud',                     '96.505.750-6', 'Providencia',    'Metropolitana',    'clinica_privada',  true),
  ('Clínica Vespucio',                      '76.046.748-K', 'La Florida',     'Metropolitana',    'clinica_privada',  true),
  ('Clínica Integramédica',                 null,           'Santiago',       'Metropolitana',    'red_medica',       true),
  -- Hospitales públicos — Santiago
  ('Hospital Clínico Universidad de Chile', '61.978.890-K', 'Independencia',  'Metropolitana',    'hospital_publico', true),
  ('Hospital Clínico UC Christus',          '81.669.600-6', 'Macul',          'Metropolitana',    'hospital_publico', true),
  ('Hospital del Salvador',                 '61.606.900-1', 'Providencia',    'Metropolitana',    'hospital_publico', true),
  ('Hospital San Juan de Dios',             '61.607.200-7', 'Santiago',       'Metropolitana',    'hospital_publico', true),
  ('Hospital Barros Luco Trudeau',          '61.607.100-0', 'San Miguel',     'Metropolitana',    'hospital_publico', true),
  ('Hospital Félix Bulnes Cerda',           '61.607.800-4', 'Quinta Normal',  'Metropolitana',    'hospital_publico', true),
  ('Hospital Roberto del Río',              '61.608.100-4', 'Independencia',  'Metropolitana',    'hospital_publico', true),
  ('Hospital Exequiel González Cortés',     '61.608.000-8', 'San Miguel',     'Metropolitana',    'hospital_publico', true),
  ('Hospital Sótero del Río',               '61.608.200-0', 'Puente Alto',    'Metropolitana',    'hospital_publico', true),
  ('Hospital Padre Hurtado',               '76.028.900-4', 'San Ramón',      'Metropolitana',    'hospital_publico', true),
  ('Hospital San Borja Arriarán',           '61.607.000-4', 'Santiago',       'Metropolitana',    'hospital_publico', true),
  ('Hospital Luis Tisné Brousse',           '61.608.500-0', 'Peñalolén',      'Metropolitana',    'hospital_publico', true),
  ('Hospital El Carmen de Maipú',           null,           'Maipú',          'Metropolitana',    'hospital_publico', true),
  ('Hospital de Urgencia Asistencia Pública', '61.606.700-9', 'Santiago',     'Metropolitana',    'hospital_publico', true),
  ('Hospital San José',                     '61.607.600-2', 'Independencia',  'Metropolitana',    'hospital_publico', true),
  -- Redes médicas
  ('RedSalud',                              null,           'Santiago',       'Metropolitana',    'red_medica',       true),
  ('Megasalud',                             null,           'Santiago',       'Metropolitana',    'red_medica',       true),
  ('Clínica Colmena',                       null,           'Santiago',       'Metropolitana',    'clinica_privada',  true),
  -- Regiones — Valparaíso
  ('Hospital Carlos van Buren',             '61.609.100-1', 'Valparaíso',     'Valparaíso',       'hospital_publico', true),
  ('Hospital Eduardo Pereira',              '61.609.200-8', 'Valparaíso',     'Valparaíso',       'hospital_publico', true),
  ('Clínica Ciudad del Mar',                null,           'Viña del Mar',   'Valparaíso',       'clinica_privada',  true),
  ('Clínica Reñaca',                        null,           'Viña del Mar',   'Valparaíso',       'clinica_privada',  true),
  -- Regiones — Biobío / Concepción
  ('Hospital Regional de Concepción',       '61.613.200-8', 'Concepción',     'Biobío',           'hospital_publico', true),
  ('Clínica Sanatorio Alemán',              null,           'Concepción',     'Biobío',           'clinica_privada',  true),
  ('Clínica Bío-Bío',                       null,           'Concepción',     'Biobío',           'clinica_privada',  true),
  -- Regiones — Antofagasta
  ('Hospital Regional de Antofagasta',      '61.609.700-4', 'Antofagasta',    'Antofagasta',      'hospital_publico', true),
  ('Clínica Antofagasta',                   null,           'Antofagasta',    'Antofagasta',      'clinica_privada',  true),
  -- Regiones — La Serena / Coquimbo
  ('Hospital San Pablo de Coquimbo',        null,           'Coquimbo',       'Coquimbo',         'hospital_publico', true),
  ('Hospital San Juan de Dios La Serena',   null,           'La Serena',      'Coquimbo',         'hospital_publico', true),
  -- Regiones — Araucanía
  ('Hospital Hernán Henríquez Aravena',     '61.615.900-1', 'Temuco',         'Araucanía',        'hospital_publico', true),
  -- Regiones — Los Lagos
  ('Hospital Puerto Montt',                 '61.618.400-0', 'Puerto Montt',   'Los Lagos',        'hospital_publico', true)
on conflict do nothing;
