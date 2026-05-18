-- Migration: Seed Chilean medical specialties
-- Populates especialidades table with common Chilean medical specialties and psychology

-- =====================================================
-- 1. Seed Chilean medical specialties
-- =====================================================

insert into public.especialidades (nombre, tipo) values
  ('Medicina General', 'medica'),
  ('Cardiología', 'medica'),
  ('Dermatología', 'medica'),
  ('Neurología', 'medica'),
  ('Pediatría', 'medica'),
  ('Ginecología y Obstetricia', 'medica'),
  ('Traumatología y Ortopedia', 'medica'),
  ('Oftalmología', 'medica'),
  ('Otorrinolaringología', 'medica'),
  ('Psiquiatría', 'medica'),
  ('Medicina Interna', 'medica'),
  ('Cirugía General', 'medica'),
  ('Anestesiología', 'medica'),
  ('Radiología', 'medica'),
  ('Patología', 'medica'),
  ('Oncología', 'medica'),
  ('Nefrología', 'medica'),
  ('Endocrinología', 'medica'),
  ('Gastroenterología', 'medica'),
  ('Reumatología', 'medica'),
  ('Neumología', 'medica'),
  ('Infectología', 'medica'),
  ('Hematología', 'medica'),
  ('Urología', 'medica'),
  ('Cirugía Plástica', 'medica'),
  ('Cirugía Cardiovascular', 'medica'),
  ('Cirugía Torácica', 'medica'),
  ('Neurocirugía', 'medica'),
  ('Medicina Familiar', 'medica'),
  ('Medicina Preventiva', 'medica'),
  ('Medicina del Trabajo', 'medica'),
  ('Geriatría', 'medica')
on conflict (nombre) do nothing;

-- =====================================================
-- 2. Seed psychology as separate type
-- =====================================================

insert into public.especialidades (nombre, tipo) values
  ('Psicología Clínica', 'psicologica'),
  ('Psicología Organizacional', 'psicologica'),
  ('Psicología Educativa', 'psicologica'),
  ('Neuropsicología', 'psicologica')
on conflict (nombre) do nothing;

-- =====================================================
-- 3. Add comment about seed data
-- =====================================================

comment on table public.especialidades is
  'Medical and psychological specialties for doctors. Includes predefined Chilean medical specialties (tipo: medica), psychology specialties (tipo: psicologica), and user-added custom specialties (tipo: personalizada).';
