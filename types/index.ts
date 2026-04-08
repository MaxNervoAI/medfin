export type EstadoPrestacion = 'realizada' | 'boleta_emitida' | 'pagada'
export type TipoDocumento = 'boleta' | 'factura'

export interface Profile {
  id: string
  nombre: string | null
  email: string | null
  especialidad: string | null
  created_at: string
}

export interface Institucion {
  id: string
  user_id: string
  nombre: string
  rut: string | null
  activa: boolean
  created_at: string
}

export interface ReglasPlazo {
  id: string
  user_id: string
  institucion_id: string
  tipo_prestacion_nombre: string
  dias_emitir_boleta: number
  dias_recibir_pago: number
  created_at: string
  instituciones?: { nombre: string }
}

export interface Prestacion {
  id: string
  user_id: string
  institucion_id: string | null
  institucion_nombre: string
  tipo_prestacion: string
  es_turno: boolean

  fecha_prestacion: string
  fecha_limite_boleta: string | null
  fecha_boleta_emitida: string | null
  fecha_limite_pago: string | null
  fecha_pago_recibido: string | null

  monto_bruto: number
  retencion_pct: number
  monto_retencion: number
  monto_neto: number

  horas: number | null
  valor_hora: number | null

  estado: EstadoPrestacion
  tipo_documento: TipoDocumento
  numero_documento: string | null
  notas: string | null

  created_at: string
  updated_at: string
}

export interface ResumenMensual {
  mes: string // YYYY-MM
  total_bruto_esperado: number
  total_neto_esperado: number
  total_cobrado: number
  total_pendiente: number
  prestaciones_sin_boleta: number
  prestaciones_boleta_emitida: number
  prestaciones_pagadas: number
}

export interface Alerta {
  id: string
  tipo: 'boleta_vence_hoy' | 'boleta_vencida' | 'pago_vence_hoy' | 'pago_vencido' | 'boleta_por_vencer'
  prestacion_id: string
  institucion_nombre: string
  tipo_prestacion: string
  fecha_limite: string
  monto_bruto: number
  dias_restantes: number
}
