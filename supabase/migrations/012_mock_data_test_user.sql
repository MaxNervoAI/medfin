-- =====================================================
-- Mock Data for test@hotmail.com
-- Simulates 30 days of work across all sections
-- =====================================================

-- Step 1: Get User ID
DO $$
DECLARE
  v_user_id uuid;
  v_start_date date := CURRENT_DATE - INTERVAL '30 days';
  v_end_date date := CURRENT_DATE;
BEGIN
  SELECT id INTO v_user_id FROM public.profiles WHERE email = 'test@hotmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User test@hotmail.com not found in profiles table';
  END IF;
  
  -- Step 2: Assign Specialties (Cardiología, Medicina Interna)
  INSERT INTO public.perfil_especialidades (perfil_id, especialidad_id)
  SELECT v_user_id, id FROM public.especialidades 
  WHERE nombre IN ('Cardiología', 'Medicina Interna')
  ON CONFLICT (perfil_id, especialidad_id) DO NOTHING;
  
  -- Step 3: Create 5 Chilean Institutions
  INSERT INTO public.instituciones (user_id, nombre, rut, activa) VALUES
    (v_user_id, 'Clínica Alemana', '76.123.456-7', true),
    (v_user_id, 'Clínica Las Condes', '76.987.654-3', true),
    (v_user_id, 'Clínica Santa María', '76.456.789-2', true),
    (v_user_id, 'Clínica Dávila', '76.321.987-5', true),
    (v_user_id, 'Clínica Reñaca', '76.654.321-8', true)
  ON CONFLICT DO NOTHING;
  
  -- Step 4: Create Service Types if they don't exist
  INSERT INTO public.tipos_prestacion (user_id, nombre, es_turno) VALUES
    (v_user_id, 'Consulta', false),
    (v_user_id, 'Procedimiento', false),
    (v_user_id, 'Cirugía', false),
    (v_user_id, 'Turno', true)
  ON CONFLICT DO NOTHING;
  
  -- Step 5: Create Deadline Rules for each institution × service type
  INSERT INTO public.reglas_plazo (user_id, institucion_id, tipo_prestacion_nombre, dias_emitir_boleta, dias_recibir_pago)
  SELECT 
    tp.user_id,
    i.id as institucion_id,
    tp.nombre as tipo_prestacion_nombre,
    (5 + (random() * 2)::int)::int as dias_emitir_boleta,
    (25 + (random() * 10)::int)::int as dias_recibir_pago
  FROM public.instituciones i
  CROSS JOIN public.tipos_prestacion tp
  WHERE tp.user_id = v_user_id
  ON CONFLICT (institucion_id, tipo_prestacion_nombre) DO NOTHING;
  
  -- Step 6: Create Prestaciones (~90 over 30 days)
  -- Generate prestaciones with realistic distribution
  WITH date_series AS (
    SELECT generate_series(v_start_date, v_end_date, '1 day'::interval)::date as fecha_prestacion
  ),
  institution_data AS (
    SELECT id, nombre FROM public.instituciones WHERE user_id = v_user_id
  ),
  service_types AS (
    SELECT nombre, es_turno FROM public.tipos_prestacion WHERE user_id = v_user_id
  )
  INSERT INTO public.prestaciones (
    user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
    fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago, fecha_pago_recibido,
    monto_bruto, estado, tipo_documento
  )
  SELECT
    v_user_id,
    i.id as institucion_id,
    i.nombre as institucion_nombre,
    st.nombre as tipo_prestacion,
    st.es_turno,
    ds.fecha_prestacion,
    ds.fecha_prestacion + (rp.dias_emitir_boleta || ' days')::interval as fecha_limite_boleta,
    CASE 
      WHEN random() < 0.7 THEN ds.fecha_prestacion + (rp.dias_emitir_boleta || ' days')::interval
      ELSE NULL
    END as fecha_boleta_emitida,
    CASE 
      WHEN fecha_boleta_emitida IS NOT NULL THEN fecha_boleta_emitida + (rp.dias_recibir_pago || ' days')::interval
      ELSE NULL
    END as fecha_limite_pago,
    CASE 
      WHEN random() < 0.3 THEN 
        CASE 
          WHEN fecha_boleta_emitida IS NOT NULL THEN fecha_boleta_emitida + (rp.dias_recibir_pago || ' days')::interval
          ELSE ds.fecha_prestacion + (rp.dias_emitir_boleta + rp.dias_recibir_pago || ' days')::interval
        END
      ELSE NULL
    END as fecha_pago_recibido,
    (30000 + (random() * 220000)::numeric(12,2)) as monto_bruto,
    CASE 
      WHEN random() < 0.3 THEN 'realizada'
      WHEN random() < 0.7 THEN 'boleta_emitida'
      ELSE 'pagada'
    END as estado,
    'boleta' as tipo_documento
  FROM date_series ds
  CROSS JOIN (SELECT * FROM institution_data ORDER BY random() LIMIT 3) i
  CROSS JOIN (SELECT * FROM service_types ORDER BY random() LIMIT 2) st
  CROSS JOIN public.reglas_plazo rp
  WHERE rp.institucion_id = i.id
    AND rp.tipo_prestacion_nombre = st.nombre
    AND random() < 0.8  -- Not every day has prestaciones
  ORDER BY ds.fecha_prestacion, i.id, st.nombre;
  
  -- Step 7: Create Calendar Appointments
  -- Create appointments for ~70-80% of prestaciones
  INSERT INTO public.appointments (
    user_id, institucion_id, titulo, descripcion, fecha_inicio, fecha_fin, estado
  )
  SELECT
    v_user_id,
    p.institucion_id,
    p.tipo_prestacion as titulo,
    'Prestación: ' || p.tipo_prestacion || ' - ' || p.institucion_nombre as descripcion,
    (p.fecha_prestacion || ' 09:00:00')::timestamptz as fecha_inicio,
    (p.fecha_prestacion || ' 10:00:00')::timestamptz as fecha_fin,
    CASE 
      WHEN p.estado = 'pagada' THEN 'completada'
      WHEN p.estado = 'boleta_emitida' THEN 'completada'
      ELSE CASE WHEN random() < 0.1 THEN 'cancelada' ELSE 'programada' END
    END as estado
  FROM public.prestaciones p
  WHERE p.user_id = v_user_id
    AND random() < 0.75  -- 75% of prestaciones have appointments
  ORDER BY p.fecha_prestacion;
  
  -- Step 8: Link Appointments to Prestaciones
  INSERT INTO public.prestaciones_citas (cita_id, prestacion_id)
  SELECT 
    a.id as cita_id,
    p.id as prestacion_id
  FROM public.appointments a
  JOIN public.prestaciones p ON 
    p.user_id = a.user_id 
    AND p.fecha_prestacion = a.fecha_inicio::date
    AND p.institucion_id = a.institucion_id
  WHERE a.user_id = v_user_id
  ORDER BY a.fecha_inicio
  LIMIT 100;
  
  RAISE NOTICE 'Mock data created successfully for user test@hotmail.com';
END $$;
