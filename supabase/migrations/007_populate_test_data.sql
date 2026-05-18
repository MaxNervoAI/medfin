-- Migration: Populate test data for test@test.com user
-- This script populates comprehensive test data to verify all functionality

-- =====================================================
-- 1. Get user ID for test@test.com and update profile
-- =====================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID from profiles table
  SELECT id INTO v_user_id FROM profiles WHERE email = 'test@test.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Update profile with test data
    UPDATE profiles SET
      nombre = 'Dr. Test User',
      email = 'test@test.com',
      especialidad = 'Medicina General',
      profession = 'Médico',
      rut = '12.345.678-9',
      city = 'Santiago'
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Updated profile for user: %', v_user_id;
  ELSE
    RAISE NOTICE 'User test@test.com not found in profiles table';
  END IF;
END $$;

-- =====================================================
-- 2. Insert Institutions
-- =====================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'test@test.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Clínica San José
    INSERT INTO instituciones (id, user_id, nombre, rut, activa)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'Clínica San José',
      '76.123.456-7',
      true
    ) ON CONFLICT DO NOTHING;
    
    -- Hospital del Trabajador
    INSERT INTO instituciones (id, user_id, nombre, rut, activa)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'Hospital del Trabajador',
      '71.234.567-8',
      true
    ) ON CONFLICT DO NOTHING;
    
    -- Centro Médico Las Condes
    INSERT INTO instituciones (id, user_id, nombre, rut, activa)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'Centro Médico Las Condes',
      '81.345.678-9',
      true
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted institutions for user: %', v_user_id;
  END IF;
END $$;

-- =====================================================
-- 3. Insert Deadline Rules
-- =====================================================

DO $$
DECLARE
  v_user_id uuid;
  v_institucion_1 uuid;
  v_institucion_2 uuid;
  v_institucion_3 uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'test@test.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Get institution IDs
    SELECT id INTO v_institucion_1 FROM instituciones WHERE user_id = v_user_id AND nombre = 'Clínica San José' LIMIT 1;
    SELECT id INTO v_institucion_2 FROM instituciones WHERE user_id = v_user_id AND nombre = 'Hospital del Trabajador' LIMIT 1;
    SELECT id INTO v_institucion_3 FROM instituciones WHERE user_id = v_user_id AND nombre = 'Centro Médico Las Condes' LIMIT 1;
    
    -- Clínica San José rules
    INSERT INTO reglas_plazo (id, user_id, institucion_id, tipo_prestacion_nombre, dias_emitir_boleta, dias_recibir_pago)
    VALUES
      (gen_random_uuid(), v_user_id, v_institucion_1, 'Consulta Medicina General', 5, 30),
      (gen_random_uuid(), v_user_id, v_institucion_1, 'Cirugía Menor', 5, 30),
      (gen_random_uuid(), v_user_id, v_institucion_1, 'Endoscopia Digestiva', 5, 30)
    ON CONFLICT DO NOTHING;
    
    -- Hospital del Trabajador rules
    INSERT INTO reglas_plazo (id, user_id, institucion_id, tipo_prestacion_nombre, dias_emitir_boleta, dias_recibir_pago)
    VALUES
      (gen_random_uuid(), v_user_id, v_institucion_2, 'Consulta Medicina General', 7, 45),
      (gen_random_uuid(), v_user_id, v_institucion_2, 'Cirugía Menor', 7, 45)
    ON CONFLICT DO NOTHING;
    
    -- Centro Médico Las Condes rules
    INSERT INTO reglas_plazo (id, user_id, institucion_id, tipo_prestacion_nombre, dias_emitir_boleta, dias_recibir_pago)
    VALUES
      (gen_random_uuid(), v_user_id, v_institucion_3, 'Consulta Medicina General', 3, 25),
      (gen_random_uuid(), v_user_id, v_institucion_3, 'Endoscopia Digestiva', 3, 25)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted reglas_plazo for user: %', v_user_id;
  END IF;
END $$;

-- =====================================================
-- 4. Insert Prestaciones
-- =====================================================

DO $$
DECLARE
  v_user_id uuid;
  v_institucion_1 uuid;
  v_institucion_2 uuid;
  v_institucion_3 uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'test@test.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Get institution IDs
    SELECT id INTO v_institucion_1 FROM instituciones WHERE user_id = v_user_id AND nombre = 'Clínica San José' LIMIT 1;
    SELECT id INTO v_institucion_2 FROM instituciones WHERE user_id = v_user_id AND nombre = 'Hospital del Trabajador' LIMIT 1;
    SELECT id INTO v_institucion_3 FROM instituciones WHERE user_id = v_user_id AND nombre = 'Centro Médico Las Condes' LIMIT 1;
    
    -- State: realizada (pending boleta) - Recent (should trigger alert if deadline approaching)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta,
      monto_bruto, retencion_pct, estado, tipo_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_1, 'Clínica San José', 'Consulta Medicina General', false,
      CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days',
      100000, 14.5, 'realizada', 'boleta'
    ) ON CONFLICT DO NOTHING;
    
    -- State: realizada (pending boleta) - Overdue (should trigger urgent alert)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta,
      monto_bruto, retencion_pct, estado, tipo_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_2, 'Hospital del Trabajador', 'Cirugía Menor', false,
      CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days',
      250000, 14.5, 'realizada', 'factura'
    ) ON CONFLICT DO NOTHING;
    
    -- State: boleta_emitida - Payment deadline approaching (should trigger alert)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_1, 'Clínica San José', 'Endoscopia Digestiva', false,
      CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days',
      280000, 14.5, 'boleta_emitida', 'boleta', '123456-1'
    ) ON CONFLICT DO NOTHING;
    
    -- State: boleta_emitida - Payment overdue (should trigger urgent alert)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_3, 'Centro Médico Las Condes', 'Consulta Medicina General', false,
      CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '37 days', CURRENT_DATE - INTERVAL '37 days', CURRENT_DATE - INTERVAL '12 days',
      80000, 14.5, 'boleta_emitida', 'factura', '987654-2'
    ) ON CONFLICT DO NOTHING;
    
    -- State: pagada - Recent payment (current month)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago, fecha_pago_recibido,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_1, 'Clínica San José', 'Consulta Medicina General', false,
      CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE - INTERVAL '2 days',
      120000, 14.5, 'pagada', 'boleta', '111111-3'
    ) ON CONFLICT DO NOTHING;
    
    -- State: pagada - Last month payment
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago, fecha_pago_recibido,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_2, 'Hospital del Trabajador', 'Cirugía Menor', false,
      CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '38 days', CURRENT_DATE - INTERVAL '38 days', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE - INTERVAL '20 days',
      300000, 14.5, 'pagada', 'factura', '222222-4'
    ) ON CONFLICT DO NOTHING;
    
    -- State: pagada - 2 months ago payment
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago, fecha_pago_recibido,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_3, 'Centro Médico Las Condes', 'Endoscopia Digestiva', false,
      CURRENT_DATE - INTERVAL '75 days', CURRENT_DATE - INTERVAL '72 days', CURRENT_DATE - INTERVAL '72 days', CURRENT_DATE - INTERVAL '47 days', CURRENT_DATE - INTERVAL '50 days',
      295000, 14.5, 'pagada', 'boleta', '333333-5'
    ) ON CONFLICT DO NOTHING;
    
    -- Turno example (hourly rate)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago, fecha_pago_recibido,
      horas, valor_hora,
      monto_bruto, retencion_pct, estado, tipo_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_1, 'Clínica San José', 'Turno Urgencia', true,
      CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day',
      4, 50000,
      200000, 14.5, 'pagada', 'boleta'
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted prestaciones for user: %', v_user_id;
  END IF;
END $$;
