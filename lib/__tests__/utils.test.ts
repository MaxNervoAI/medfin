import {
  formatMonto,
  formatFecha,
  formatFechaCorta,
  calcularFechaLimiteBoleta,
  calcularFechaLimitePago,
  diasHasta,
  generarAlertas,
  getMesActual,
  getNombreMes,
  calcularIngresosPorMes,
} from '../utils'
import type { Prestacion } from '@/types'

describe('formatMonto', () => {
  it('formats large numbers with Chilean style', () => {
    expect(formatMonto(1000000)).toBe('$1.000.000')
  })

  it('formats small numbers', () => {
    expect(formatMonto(1000)).toBe('$1.000')
  })

  it('rounds decimal values', () => {
    expect(formatMonto(1234.56)).toBe('$1.235')
  })

  it('handles zero', () => {
    expect(formatMonto(0)).toBe('$0')
  })

  it('handles negative values', () => {
    expect(formatMonto(-1000)).toBe('$-1.000')
  })
})

describe('formatFecha', () => {
  it('formats date in Spanish long format', () => {
    expect(formatFecha('2024-05-10')).toBe('10 de mayo 2024')
  })

  it('handles different months', () => {
    expect(formatFecha('2024-01-15')).toBe('15 de enero 2024')
    expect(formatFecha('2024-12-25')).toBe('25 de diciembre 2024')
  })
})

describe('formatFechaCorta', () => {
  it('formats date in short format', () => {
    expect(formatFechaCorta('2024-05-10')).toBe('10/05/2024')
  })

  it('handles leading zeros', () => {
    expect(formatFechaCorta('2024-01-05')).toBe('05/01/2024')
  })
})

describe('calcularFechaLimiteBoleta', () => {
  it('calculates deadline for boleta emission', () => {
    expect(calcularFechaLimiteBoleta('2024-05-10', 5)).toBe('2024-05-14')
  })

  it('handles zero days', () => {
    expect(calcularFechaLimiteBoleta('2024-05-10', 0)).toBe('2024-05-09')
  })

  it('handles month boundary', () => {
    expect(calcularFechaLimiteBoleta('2024-05-30', 5)).toBe('2024-06-03')
  })

  it('handles year boundary', () => {
    expect(calcularFechaLimiteBoleta('2024-12-30', 5)).toBe('2025-01-03')
  })
})

describe('calcularFechaLimitePago', () => {
  it('calculates payment deadline', () => {
    expect(calcularFechaLimitePago('2024-05-15', 30)).toBe('2024-06-13')
  })

  it('handles zero days', () => {
    expect(calcularFechaLimitePago('2024-05-15', 0)).toBe('2024-05-14')
  })

  it('handles month boundary', () => {
    expect(calcularFechaLimitePago('2024-05-25', 10)).toBe('2024-06-03')
  })
})

describe('diasHasta', () => {
  it('calculates days until a future date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const dateString = futureDate.toISOString().split('T')[0]
    expect(diasHasta(dateString)).toBeGreaterThanOrEqual(4)
  })

  it('calculates days past a date', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 3)
    const dateString = pastDate.toISOString().split('T')[0]
    expect(diasHasta(dateString)).toBeLessThanOrEqual(-3)
  })

  it('handles today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(diasHasta(today)).toBe(0)
  })
})

describe('getMesActual', () => {
  it('returns current month in YYYY-MM format', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(getMesActual()).toBe(expected)
  })
})

describe('getNombreMes', () => {
  it('returns month name in Spanish', () => {
    expect(getNombreMes('2024-05')).toBe('mayo 2024')
    expect(getNombreMes('2024-01')).toBe('enero 2024')
    expect(getNombreMes('2024-12')).toBe('diciembre 2024')
  })
})

describe('generarAlertas', () => {
  it('generates alert for overdue boleta', () => {
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: '2024-05-05',
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: null,
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'realizada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
    ]
    const alertas = generarAlertas(prestaciones)
    expect(alertas).toHaveLength(1)
    expect(alertas[0].tipo).toBe('boleta_vencida')
    expect(alertas[0].dias_restantes).toBeLessThan(0)
  })

  it('generates alert for boleta due today', () => {
    const today = new Date().toISOString().split('T')[0]
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: today,
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: null,
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'realizada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
    ]
    const alertas = generarAlertas(prestaciones)
    expect(alertas).toHaveLength(1)
    expect(alertas[0].tipo).toBe('boleta_vence_hoy')
    expect(alertas[0].dias_restantes).toBe(0)
  })

  it('generates alert for boleta due soon (3 days)', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 2)
    const dateString = futureDate.toISOString().split('T')[0]
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: dateString,
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: null,
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'realizada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
    ]
    const alertas = generarAlertas(prestaciones)
    expect(alertas).toHaveLength(1)
    expect(alertas[0].tipo).toBe('boleta_por_vencer')
    expect(alertas[0].dias_restantes).toBeLessThanOrEqual(3)
  })

  it('skips snoozed alerts', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const snoozeUntil = futureDate.toISOString().split('T')[0]
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: '2024-05-05',
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: null,
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'realizada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: snoozeUntil,
      },
    ]
    const alertas = generarAlertas(prestaciones)
    expect(alertas).toHaveLength(0)
  })

  it('generates alert for overdue payment', () => {
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: null,
        fecha_boleta_emitida: '2024-05-05',
        fecha_limite_pago: '2024-05-20',
        fecha_pago_recibido: null,
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'boleta_emitida',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
    ]
    const alertas = generarAlertas(prestaciones)
    expect(alertas).toHaveLength(1)
    expect(alertas[0].tipo).toBe('pago_vencido')
    expect(alertas[0].dias_restantes).toBeLessThan(0)
  })

  it('sorts alerts by urgency (overdue first)', () => {
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: '2024-05-05',
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: null,
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'realizada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
      {
        id: '2',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica B',
        tipo_prestacion: 'Consulta',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: '2024-05-10',
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: null,
        monto_bruto: 50000,
        retencion_pct: 14.5,
        monto_retencion: 7250,
        monto_neto: 42750,
        horas: null,
        valor_hora: null,
        estado: 'realizada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
    ]
    const alertas = generarAlertas(prestaciones)
    expect(alertas).toHaveLength(2)
    expect(alertas[0].dias_restantes).toBeLessThanOrEqual(alertas[1].dias_restantes)
  })

  it('handles empty prestaciones array', () => {
    const alertas = generarAlertas([])
    expect(alertas).toHaveLength(0)
  })

  it('handles prestaciones without deadlines', () => {
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: null,
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: null,
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'realizada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
    ]
    const alertas = generarAlertas(prestaciones)
    expect(alertas).toHaveLength(0)
  })
})

describe('calcularIngresosPorMes', () => {
  it('calculates income for current month', () => {
    const currentMonth = getMesActual()
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: null,
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: currentMonth + '-15',
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'pagada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
    ]
    const ingresos = calcularIngresosPorMes(prestaciones)
    const currentMonthData = ingresos.find(m => m.mes === currentMonth)
    expect(currentMonthData?.total).toBe(85500)
  })

  it('groups income by type', () => {
    const currentMonth = getMesActual()
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: null,
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: currentMonth + '-15',
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'pagada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
      {
        id: '2',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-02',
        fecha_limite_boleta: null,
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: currentMonth + '-20',
        monto_bruto: 150000,
        retencion_pct: 14.5,
        monto_retencion: 21750,
        monto_neto: 128250,
        horas: null,
        valor_hora: null,
        estado: 'pagada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-02',
        updated_at: '2024-05-02',
        alerta_snoozed_until: null,
      },
      {
        id: '3',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica B',
        tipo_prestacion: 'Consulta',
        es_turno: false,
        fecha_prestacion: '2024-05-03',
        fecha_limite_boleta: null,
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: currentMonth + '-25',
        monto_bruto: 50000,
        retencion_pct: 14.5,
        monto_retencion: 7250,
        monto_neto: 42750,
        horas: null,
        valor_hora: null,
        estado: 'pagada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-03',
        updated_at: '2024-05-03',
        alerta_snoozed_until: null,
      },
    ]
    const ingresos = calcularIngresosPorMes(prestaciones)
    const currentMonthData = ingresos.find(m => m.mes === currentMonth)
    expect(currentMonthData?.ingresos).toHaveLength(2) // Cirugia and Consulta
  })

  it('generates 7-month range', () => {
    const ingresos = calcularIngresosPorMes([])
    expect(ingresos).toHaveLength(7)
  })

  it('handles prestaciones without payment dates', () => {
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: null,
        fecha_boleta_emitida: null,
        fecha_limite_pago: null,
        fecha_pago_recibido: null,
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'realizada',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
    ]
    const ingresos = calcularIngresosPorMes(prestaciones)
    const currentMonth = getMesActual()
    const currentMonthData = ingresos.find(m => m.mes === currentMonth)
    expect(currentMonthData?.total).toBe(0)
  })

  it('uses fecha_limite_pago when fecha_pago_recibido is missing', () => {
    const currentMonth = getMesActual()
    const prestaciones: Prestacion[] = [
      {
        id: '1',
        user_id: 'test-user',
        institucion_id: null,
        institucion_nombre: 'Clinica A',
        tipo_prestacion: 'Cirugia',
        es_turno: false,
        fecha_prestacion: '2024-05-01',
        fecha_limite_boleta: null,
        fecha_boleta_emitida: '2024-05-05',
        fecha_limite_pago: currentMonth + '-20',
        fecha_pago_recibido: null,
        monto_bruto: 100000,
        retencion_pct: 14.5,
        monto_retencion: 14500,
        monto_neto: 85500,
        horas: null,
        valor_hora: null,
        estado: 'boleta_emitida',
        tipo_documento: 'boleta',
        numero_documento: null,
        notas: null,
        created_at: '2024-05-01',
        updated_at: '2024-05-01',
        alerta_snoozed_until: null,
      },
    ]
    const ingresos = calcularIngresosPorMes(prestaciones)
    const currentMonthData = ingresos.find(m => m.mes === currentMonth)
    expect(currentMonthData?.total).toBe(85500)
  })

  it('handles empty prestaciones array', () => {
    const ingresos = calcularIngresosPorMes([])
    expect(ingresos).toHaveLength(7)
    ingresos.forEach(mes => {
      expect(mes.total).toBe(0)
      expect(mes.ingresos).toHaveLength(0)
    })
  })
})
