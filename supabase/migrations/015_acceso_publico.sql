-- =====================================================
-- EPIC-015: Acceso público de solo lectura
--   Habilita las páginas sin login /calculadora y /directorio:
--   visitantes anónimos pueden leer la tasa de retención vigente
--   y buscar en el catálogo VERIFICADO de instituciones.
-- =====================================================

-- 1. Directorio: el rol `anon` solo ve el catálogo verificado.
--    Los aportes de comunidad sin verificar siguen siendo privados
--    de su autor (política de 014, rol authenticated).
drop policy if exists "directorio_read_publico_verificadas" on public.instituciones_directorio;

create policy "directorio_read_publico_verificadas"
  on public.instituciones_directorio for select
  to anon
  using (verificada);

-- La RPC es SECURITY INVOKER, así que hereda la política de arriba:
-- un visitante anónimo jamás ve filas sin verificar.
grant execute on function public.buscar_directorio(text, int) to anon;

-- 2. Tasa de retención: es un parámetro legal público (no dato de usuario),
--    la calculadora pública la necesita sin sesión.
drop policy if exists "tax_settings_read_publico" on public.tax_settings;

create policy "tax_settings_read_publico"
  on public.tax_settings for select
  to anon
  using (true);
