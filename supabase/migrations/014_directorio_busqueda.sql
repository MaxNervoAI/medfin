-- =====================================================
-- EPIC-014: Búsqueda sin acentos, deduplicación y
--           moderación del directorio compartido
-- =====================================================
--
-- Problemas que resuelve:
--   1. `ilike '%term%'` no ignora acentos: buscar "clinica alemana"
--      no encontraba "Clínica Alemana" y el usuario creaba un duplicado.
--   2. El índice btree sobre `nombre` no sirve para `%term%` (scan secuencial).
--   3. `with check (true)` dejaba que cualquier usuario escribiera de forma
--      permanente en el directorio de todos, sin unicidad ni moderación.

-- -----------------------------------------------------
-- 1. Extensiones
-- -----------------------------------------------------
create schema if not exists extensions;

-- OJO: `create extension if not exists` NO mueve una extensión ya instalada.
-- En este proyecto `unaccent` ya existe, así que no se asume su esquema:
-- todo se resuelve por search_path en vez de calificar a mano.
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

-- Resolución por search_path para el resto de la migración (índice trigram).
set search_path = public, extensions;

-- `unaccent` es STABLE, no IMMUTABLE, así que no se puede usar directamente
-- en una columna generada. La forma de dos argumentos fija el diccionario y
-- permite envolverla en una función inmutable.
-- El nombre del diccionario va sin calificar a propósito: se resuelve con el
-- search_path de la función, sirva la extensión en `extensions` o en `public`.
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
strict
parallel safe
set search_path = extensions, public, pg_catalog
as $$
  select unaccent('unaccent'::regdictionary, $1)
$$;

-- Falla temprano y con un mensaje claro si la extensión no quedó accesible.
do $$
begin
  if public.immutable_unaccent('Clínica') <> 'Clinica' then
    raise exception 'immutable_unaccent no normaliza correctamente';
  end if;
end $$;

-- -----------------------------------------------------
-- 2. Columna normalizada para búsqueda
-- -----------------------------------------------------
alter table public.instituciones_directorio
  add column if not exists nombre_norm text
    generated always as (lower(public.immutable_unaccent(nombre))) stored;

-- -----------------------------------------------------
-- 3. Autoría, para poder moderar los aportes de la comunidad
-- -----------------------------------------------------
alter table public.instituciones_directorio
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Backfill obligatorio antes de endurecer RLS.
-- La política nueva es `verificada or created_by = auth.uid()`, y como
-- `null = auth.uid()` evalúa a NULL (no a true), cualquier fila sin verificar
-- y sin autor quedaría invisible para TODOS —incluido quien la creó— pero
-- seguiría ocupando el índice único. Volver a agregarla fallaría contra una
-- fila que nadie puede ver.

-- a) Atribuir cada aporte al usuario que primero lo enlazó.
update public.instituciones_directorio d
   set created_by = sub.user_id
  from (
    select distinct on (directorio_id) directorio_id, user_id
      from public.instituciones
     where directorio_id is not null
     order by directorio_id, created_at asc
  ) sub
 where d.id = sub.directorio_id
   and d.created_by is null;

-- b) Las que quedan sin autor identificable ya eran visibles para todos antes
--    de esta migración; se promueven al catálogo para conservar exactamente
--    la visibilidad actual en vez de hacerlas desaparecer.
update public.instituciones_directorio
   set verificada = true
 where not verificada
   and created_by is null;

-- -----------------------------------------------------
-- 4. Deduplicar antes de imponer unicidad
--    Se conserva la fila verificada (o la más antigua) y se repuntan
--    las instituciones de usuario hacia la superviviente.
-- -----------------------------------------------------
with ranked as (
  select
    id,
    first_value(id) over (
      partition by nombre_norm, coalesce(ciudad, '')
      order by verificada desc, created_at asc, id asc
    ) as keeper_id
  from public.instituciones_directorio
)
update public.instituciones i
   set directorio_id = r.keeper_id
  from ranked r
 where i.directorio_id = r.id
   and r.id <> r.keeper_id;

with ranked as (
  select
    id,
    first_value(id) over (
      partition by nombre_norm, coalesce(ciudad, '')
      order by verificada desc, created_at asc, id asc
    ) as keeper_id
  from public.instituciones_directorio
)
delete from public.instituciones_directorio d
 using ranked r
 where d.id = r.id
   and r.id <> r.keeper_id;

-- -----------------------------------------------------
-- 5. Índices
-- -----------------------------------------------------
-- El btree sobre `nombre` no puede servir búsquedas con comodín inicial.
drop index if exists public.idx_directorio_nombre_text;

-- gin_trgm_ops sin calificar: lo resuelve el search_path fijado arriba.
create index if not exists idx_directorio_nombre_trgm
  on public.instituciones_directorio
  using gin (nombre_norm gin_trgm_ops);

-- El mismo nombre puede existir en comunas distintas (el registro DEIS
-- tiene 24 casos), por eso la clave incluye la ciudad/comuna.
create unique index if not exists uq_directorio_nombre_ciudad
  on public.instituciones_directorio (nombre_norm, coalesce(ciudad, ''));

-- -----------------------------------------------------
-- 6. Nuevos tipos de establecimiento presentes en el registro oficial
-- -----------------------------------------------------
alter table public.instituciones_directorio
  drop constraint if exists instituciones_directorio_tipo_check;

alter table public.instituciones_directorio
  add constraint instituciones_directorio_tipo_check
  check (tipo in (
    'hospital_publico',
    'clinica_privada',
    'centro_medico',
    'red_medica',
    'laboratorio',
    'centro_dialisis',
    'otro'
  ));

-- -----------------------------------------------------
-- 7. RLS: los aportes sin verificar solo los ve su autor
-- -----------------------------------------------------
drop policy if exists "directorio_read_all"   on public.instituciones_directorio;
drop policy if exists "directorio_insert_any" on public.instituciones_directorio;

-- Lectura: catálogo verificado para todos; borradores solo para su autor.
create policy "directorio_read_verificadas_o_propias"
  on public.instituciones_directorio for select
  to authenticated
  using (verificada or created_by = auth.uid());

-- Escritura: se puede aportar, pero nunca auto-verificarse ni suplantar autoría.
create policy "directorio_insert_propias_sin_verificar"
  on public.instituciones_directorio for insert
  to authenticated
  with check (created_by = auth.uid() and verificada = false);

-- Corrección: solo sobre los aportes propios que aún no se verifican.
create policy "directorio_update_propias_sin_verificar"
  on public.instituciones_directorio for update
  to authenticated
  using (created_by = auth.uid() and verificada = false)
  with check (created_by = auth.uid() and verificada = false);

create policy "directorio_delete_propias_sin_verificar"
  on public.instituciones_directorio for delete
  to authenticated
  using (created_by = auth.uid() and verificada = false);

-- -----------------------------------------------------
-- 8. Búsqueda insensible a acentos
--    SECURITY INVOKER: las políticas de arriba siguen aplicando.
-- -----------------------------------------------------
create or replace function public.buscar_directorio(
  termino text,
  limite  int default 12
)
returns setof public.instituciones_directorio
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select *
    from public.instituciones_directorio
   where nombre_norm like '%' || lower(public.immutable_unaccent(termino)) || '%'
   order by verificada desc, nombre
   limit least(greatest(limite, 1), 50)
$$;

grant execute on function public.buscar_directorio(text, int) to authenticated;
