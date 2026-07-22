-- =====================================================
-- PREFLIGHT de la migración 014 — SOLO LECTURA
-- Pégalo en el SQL Editor de Supabase (proyecto medfin/drwallet)
-- y revisa los resultados ANTES de aplicar 014.
-- No modifica nada.
-- =====================================================

-- 0. ¿Estamos en el proyecto correcto?
select current_database() as base,
       (select count(*) from information_schema.tables
         where table_schema='public' and table_name='instituciones_directorio') as tiene_directorio,
       (select count(*) from information_schema.tables
         where table_schema='public' and table_name='prestaciones') as tiene_prestaciones;
-- Se espera tiene_directorio = 1 y tiene_prestaciones = 1.
-- Si son 0, estás en el proyecto equivocado: DETENTE.

-- 1. Extensiones necesarias disponibles
select name, default_version, installed_version
  from pg_available_extensions
 where name in ('unaccent','pg_trgm');
-- installed_version puede ser null (la migración las instala),
-- pero AMBAS deben aparecer listadas.

-- 2. Tamaño actual
select (select count(*) from public.instituciones_directorio) as filas_directorio,
       (select count(*) from public.instituciones)            as filas_usuario,
       (select count(*) from public.instituciones_directorio where verificada) as verificadas,
       (select count(*) from public.instituciones_directorio where not verificada) as sin_verificar;

-- 3. ¿Cuántas filas ELIMINARÍA la deduplicación?
--    Usa unaccent directo (aún no existe immutable_unaccent).
create extension if not exists unaccent;
with g as (
  select lower(unaccent(nombre)) as norm,
         coalesce(ciudad,'')     as ciudad_k,
         count(*)                as n
    from public.instituciones_directorio
   group by 1,2
  having count(*) > 1
)
select coalesce(sum(n - 1), 0) as filas_a_eliminar,
       count(*)                as grupos_duplicados
  from g;
-- Ideal: 0 y 0.

-- 3b. Detalle de los duplicados (si los hay)
with g as (
  select lower(unaccent(nombre)) as norm, coalesce(ciudad,'') as ciudad_k
    from public.instituciones_directorio
   group by 1,2 having count(*) > 1
)
select d.id, d.nombre, d.ciudad, d.tipo, d.verificada, d.created_at
  from public.instituciones_directorio d
  join g on lower(unaccent(d.nombre)) = g.norm
        and coalesce(d.ciudad,'')     = g.ciudad_k
 order by g.norm, d.verificada desc, d.created_at;

-- 4. Instituciones de usuario que habría que repuntar
with ranked as (
  select id,
         first_value(id) over (
           partition by lower(unaccent(nombre)), coalesce(ciudad,'')
           order by verificada desc, created_at asc, id asc
         ) as keeper_id
    from public.instituciones_directorio
)
select count(*) as enlaces_a_repuntar
  from public.instituciones i
  join ranked r on i.directorio_id = r.id
 where r.id <> r.keeper_id;

-- 5. Tipos que violarían el nuevo CHECK
select tipo, count(*)
  from public.instituciones_directorio
 where tipo not in ('hospital_publico','clinica_privada','centro_medico',
                    'red_medica','laboratorio','centro_dialisis','otro')
 group by tipo;
-- Ideal: 0 filas.

-- 6. Impacto del cambio de RLS sobre las filas sin verificar.
--    La migración las atribuye al primer usuario que las enlazó; las que no
--    tengan autor identificable se promueven a verificada = true para
--    conservar su visibilidad actual. Aquí se ve qué le pasará a cada una.
select d.id,
       d.nombre,
       d.ciudad,
       (select i.user_id
          from public.instituciones i
         where i.directorio_id = d.id
         order by i.created_at asc
         limit 1) as futuro_created_by,
       case
         when exists (select 1 from public.instituciones i where i.directorio_id = d.id)
           then 'se atribuye a su autor (visible solo para él)'
         else 'se promueve a verificada (sigue visible para todos)'
       end as resultado
  from public.instituciones_directorio d
 where not d.verificada
 order by d.created_at;

-- 7. Enlaces rotos previos
select count(*) as huerfanas
  from public.instituciones i
 where i.directorio_id is not null
   and not exists (select 1 from public.instituciones_directorio d where d.id = i.directorio_id);
