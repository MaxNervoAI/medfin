import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Alerta, Prestacion } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMonto(monto: number): string {
  // Formato chileno manual: $1.000.000 (no depende de locale del servidor)
  const numero = Math.round(monto)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `$${numero}`
}

export function formatFecha(fecha: string): string {
  return format(parseISO(fecha), "d 'de' MMMM yyyy", { locale: es })
}

export function formatFechaCorta(fecha: string): string {
  return format(parseISO(fecha), 'dd/MM/yyyy')
}

export function calcularFechaLimiteBoleta(
  fechaPrestacion: string,
  diasEmitir: number
): string {
  return addDays(parseISO(fechaPrestacion), diasEmitir).toISOString().split('T')[0]
}

export function calcularFechaLimitePago(
  fechaBoleta: string,
  diasRecibir: number
): string {
  return addDays(parseISO(fechaBoleta), diasRecibir).toISOString().split('T')[0]
}

export function diasHasta(fecha: string): number {
  return differenceInDays(parseISO(fecha), new Date())
}

export function generarAlertas(prestaciones: Prestacion[]): Alerta[] {
  const hoy = new Date()
  const alertas: Alerta[] = []

  for (const p of prestaciones) {
    if (p.estado === 'realizada' && p.fecha_limite_boleta) {
      const dias = differenceInDays(parseISO(p.fecha_limite_boleta), hoy)
      if (dias < 0) {
        alertas.push({
          id: `${p.id}-boleta-vencida`,
          tipo: 'boleta_vencida',
          prestacion_id: p.id,
          institucion_nombre: p.institucion_nombre,
          tipo_prestacion: p.tipo_prestacion,
          fecha_limite: p.fecha_limite_boleta,
          monto_bruto: p.monto_bruto,
          dias_restantes: dias,
        })
      } else if (dias === 0) {
        alertas.push({
          id: `${p.id}-boleta-hoy`,
          tipo: 'boleta_vence_hoy',
          prestacion_id: p.id,
          institucion_nombre: p.institucion_nombre,
          tipo_prestacion: p.tipo_prestacion,
          fecha_limite: p.fecha_limite_boleta,
          monto_bruto: p.monto_bruto,
          dias_restantes: 0,
        })
      } else if (dias <= 3) {
        alertas.push({
          id: `${p.id}-boleta-pronto`,
          tipo: 'boleta_por_vencer',
          prestacion_id: p.id,
          institucion_nombre: p.institucion_nombre,
          tipo_prestacion: p.tipo_prestacion,
          fecha_limite: p.fecha_limite_boleta,
          monto_bruto: p.monto_bruto,
          dias_restantes: dias,
        })
      }
    }

    if (p.estado === 'boleta_emitida' && p.fecha_limite_pago) {
      const dias = differenceInDays(parseISO(p.fecha_limite_pago), hoy)
      if (dias < 0) {
        alertas.push({
          id: `${p.id}-pago-vencido`,
          tipo: 'pago_vencido',
          prestacion_id: p.id,
          institucion_nombre: p.institucion_nombre,
          tipo_prestacion: p.tipo_prestacion,
          fecha_limite: p.fecha_limite_pago,
          monto_bruto: p.monto_bruto,
          dias_restantes: dias,
        })
      } else if (dias === 0) {
        alertas.push({
          id: `${p.id}-pago-hoy`,
          tipo: 'pago_vence_hoy',
          prestacion_id: p.id,
          institucion_nombre: p.institucion_nombre,
          tipo_prestacion: p.tipo_prestacion,
          fecha_limite: p.fecha_limite_pago,
          monto_bruto: p.monto_bruto,
          dias_restantes: 0,
        })
      }
    }
  }

  // Ordenar: vencidas primero, luego por urgencia
  return alertas.sort((a, b) => a.dias_restantes - b.dias_restantes)
}

export function getMesActual(): string {
  return format(new Date(), 'yyyy-MM')
}

export function getNombreMes(mes: string): string {
  const [year, month] = mes.split('-')
  return format(new Date(parseInt(year), parseInt(month) - 1), "MMMM yyyy", { locale: es })
}

export function calcularIngresosPorMes(prestaciones: Prestacion[]) {
  const mesActual = getMesActual()
  const [year, month] = mesActual.split('-').map(Number)

  // Generar rango de 7 meses: 3 anteriores + actual + 3 siguientes
  const meses: Array<{
    mes: string
    nombre: string
    ingresos: Array<{ tipo: string; monto: number }>
    total: number
  }> = []

  for (let i = -3; i <= 3; i++) {
    let m = month + i
    let y = year

    if (m <= 0) {
      m += 12
      y -= 1
    } else if (m > 12) {
      m -= 12
      y += 1
    }

    const mesClave = `${y}-${String(m).padStart(2, '0')}`

    // Agrupar ingresos esperados por tipo de prestación para este mes
    const ingresosPorTipo: { [key: string]: number } = {}

    prestaciones.forEach(p => {
      // Determinar fecha de pago esperada
      let fechaPagoEsperada: string | null = null

      if (p.fecha_pago_recibido) {
        // Si ya fue pagada, usar la fecha real de pago
        fechaPagoEsperada = p.fecha_pago_recibido
      } else if (p.fecha_limite_pago) {
        // Si tiene fecha límite de pago, usar esa
        fechaPagoEsperada = p.fecha_limite_pago
      } else if (p.estado === 'boleta_emitida') {
        // Si la boleta fue emitida, calcular desde fecha_boleta_emitida
        // (pero no tenemos la fecha exacta, así que usamos fecha_limite_pago si existe)
        fechaPagoEsperada = p.fecha_limite_pago
      } else if (p.estado === 'realizada') {
        // Si aún no se emitió boleta, estimar: fecha_prestacion + dias límite boleta + dias pago
        // Por ahora no la contamos, ya que depende de reglas que no siempre existen
        return
      }

      if (!fechaPagoEsperada) return

      const mesPago = fechaPagoEsperada.substring(0, 7)

      if (mesPago === mesClave) {
        if (!ingresosPorTipo[p.tipo_prestacion]) {
          ingresosPorTipo[p.tipo_prestacion] = 0
        }
        ingresosPorTipo[p.tipo_prestacion] += p.monto_neto
      }
    })

    // Convertir a array para las barras apiladas
    const ingresos = Object.entries(ingresosPorTipo).map(([tipo, monto]) => ({
      tipo,
      monto: Math.round(monto),
    }))

    const total = ingresos.reduce((sum, i) => sum + i.monto, 0)

    meses.push({
      mes: mesClave,
      nombre: getNombreMes(mesClave).split(' ')[0], // solo el mes, no el año
      ingresos,
      total,
    })
  }

  return meses
}
