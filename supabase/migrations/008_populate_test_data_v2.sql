-- Migration: Populate test data for test@test.com user (v2)
-- Handles case where user exists in auth.users but not in profiles

-- =====================================================
-- 1. Create profile for test@test.com if it doesn't exist
-- =====================================================

DO $$
DECLARE
  v_user_id uuid;
  v_profile_exists boolean;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'test@test.com' LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
      -- Create profile
      INSERT INTO profiles (id, nombre, email, especialidad, profession, rut, city)
      VALUES (
        v_user_id,
        'Dr. Test User',
        'test@test.com',
        'Medicina General',
        'Médico',
        '12.345.678-9',
        'Santiago'
      );
      RAISE NOTICE 'Created profile for test@test.com: %', v_user_id;
    ELSE
      -- Update existing profile
      UPDATE profiles SET
        nombre = 'Dr. Test User',
        email = 'test@test.com',
        especialidad = 'Medicina General',
        profession = 'Médico',
        rut = '12.345.678-9',
        city = 'Santiago'
      WHERE id = v_user_id;
      RAISE NOTICE 'Updated profile for test@test.com: %', v_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'User test@test.com not found in auth.users. Please create account first.';
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
    -- Delete existing institutions for this user to avoid duplicates
    DELETE FROM instituciones WHERE user_id = v_user_id;
    
    -- Clínica San José
    INSERT INTO instituciones (id, user_id, nombre, rut, activa)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'Clínica San José',
      '76.123.456-7',
      true
    );
    
    -- Hospital del Trabajador
    INSERT INTO instituciones (id, user_id, nombre, rut, activa)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'Hospital del Trabajador',
      '71.234.567-8',
      true
    );
    
    -- Centro Médico Las Condes
    INSERT INTO instituciones (id, user_id, nombre, rut, activa)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'Centro Médico Las Condes',
      '81.345.678-9',
      true
    );
    
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
    -- Delete existing reglas_plazo for this user
    DELETE FROM reglas_plazo WHERE user_id = v_user_id;
    
    -- Get institution IDs
    SELECT id INTO v_institucion_1 FROM instituciones WHERE user_id = v_user_id AND nombre = 'Clínica San José' LIMIT 1;
    SELECT id INTO v_institucion_2 FROM instituciones WHERE user_id = v_user_id AND nombre = 'Hospital del Trabajador' LIMIT 1;
    SELECT id INTO v_institucion_3 FROM instituciones WHERE user_id = v_user_id AND nombre = 'Centro Médico Las Condes' LIMIT 1;
    
    -- Clínica San José rules
    INSERT INTO reglas_plazo (id, user_id, institucion_id, tipo_prestacion_nombre, dias_emitir_boleta, dias_recibir_pago)
    VALUES
      (gen_random_uuid(), v_user_id, v_institucion_1, 'Consulta Medicina General', 5, 30),
      (gen_random_uuid(), v_user_id, v_institucion_1, 'Cirugía Menor', 5, 30),
      (gen_random_uuid(), v_user_id, v_institucion_1, 'Endoscopia Digestiva', 5, 30);
    
    -- Hospital del Trabajador rules
    INSERT INTO reglas_plazo (id, user_id, institucion_id, tipo_prestacion_nombre, dias_emitir_boleta, dias_recibir_pago)
    VALUES
      (gen_random_uuid(), v_user_id, v_institucion_2, 'Consulta Medicina General', 7, 45),
      (gen_random_uuid(), v_user_id, v_institucion_2, 'Cirugía Menor', 7, 45);
    
    -- Centro Médico Las Condes rules
    INSERT INTO reglas_plazo (id, user_id, institucion_id, tipo_prestacion_nombre, dias_emitir_boleta, dias_recibir_pago)
    VALUES
      (gen_random_uuid(), v_user_id, v_institucion_3, 'Consulta Medicina General', 3, 25),
      (gen_random_uuid(), v_user_id, v_institucion_3, 'Endoscopia Digestiva', 3, 25);
    
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
    -- Delete existing prestaciones for this user
    DELETE FROM prestaciones WHERE user_id = v_user_id;
    
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
    );
    
    -- State: realizada (pending boleta) - Overdue (should trigger urgent alert)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta,
      monto_bruto, retencion_pct, estado, tipo_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_2, 'Hospital del Trabajador', 'Cirugía Menor', false,
      CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days',
      250000, 14.5, 'realizada', 'factura'
    );
    
    -- State: boleta_emitida - Payment deadline approaching (should trigger alert)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_1, 'Clínica San José', 'Endoscopia Digestiva', false,
      CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days',
      280000, 14.5, 'boleta_emitida', 'boleta', '123456-1'
    );
    
    -- State: boleta_emitida - Payment overdue (should trigger urgent alert)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_3, 'Centro Médico Las Condes', 'Consulta Medicina General', false,
      CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '37 days', CURRENT_DATE - INTERVAL '37 days', CURRENT_DATE - INTERVAL '12 days',
      80000, 14.5, 'boleta_emitida', 'factura', '987654-2'
    );
    
    -- State: pagada - Recent payment (current month)
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago, fecha_pago_recibido,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_1, 'Clínica San José', 'Consulta Medicina General', false,
      CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE - INTERVAL '2 days',
      120000, 14.5, 'pagada', 'boleta', '111111-3'
    );
    
    -- State: pagada - Last month payment
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago, fecha_pago_recibido,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_2, 'Hospital del Trabajador', 'Cirugía Menor', false,
      CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '38 days', CURRENT_DATE - INTERVAL '38 days', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE - INTERVAL '20 days',
      300000, 14.5, 'pagada', 'factura', '222222-4'
    );
    
    -- State: pagada - 2 months ago payment
    INSERT INTO prestaciones (
      id, user_id, institucion_id, institucion_nombre, tipo_prestacion, es_turno,
      fecha_prestacion, fecha_limite_boleta, fecha_boleta_emitida, fecha_limite_pago, fecha_pago_recibido,
      monto_bruto, retencion_pct, estado, tipo_documento, numero_documento
    ) VALUES (
      gen_random_uuid(), v_user_id, v_institucion_3, 'Centro Médico Las Condes', 'Endoscopia Digestiva', false,
      CURRENT_DATE - INTERVAL '75 days', CURRENT_DATE - INTERVAL '72 days', CURRENT_DATE - INTERVAL '72 days', CURRENT_DATE - INTERVAL '47 days', CURRENT_DATE - INTERVAL '50 days',
      295000, 14.5, 'pagada', 'boleta', '333333-5'
    );
    
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
    );
    
    RAISE NOTICE 'Inserted prestaciones for user: %', v_user_id;
  END IF;
END $$;
