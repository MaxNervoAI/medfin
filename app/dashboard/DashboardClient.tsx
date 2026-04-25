'use client'

import Link from 'next/link'
import { generarAlertas, formatMonto, getMesActual } from '@/lib/utils'
import type { Prestacion, Alerta } from '@/types'
import { ArrowRight } from 'lucide-react'

interface Props {
  nombre: string
  prestaciones: Prestacion[]
}

function AlertaItem({ alerta, onOpen }: { alerta: Alerta; onOpen?: (p: Prestacion) => void }) {
  const formatFecha = (d: string) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })

  const cfg = {
    boleta_vencida: { tag: 'Boleta vencida', variant: 'danger' as const, meta: `hace ${Math.abs(alerta.dias_restantes)}d` },
    boleta_vence_hoy: { tag: 'Emitir hoy', variant: 'warning' as const, meta: 'hoy' },
    boleta_por_vencer: { tag: `Emitir en ${alerta.dias_restantes}d`, variant: 'warning' as const, meta: `en ${alerta.dias_restantes}d` },
    pago_vencido: { tag: 'Pago vencido', variant: 'danger' as const, meta: `hace ${Math.abs(alerta.dias_restantes)}d` },
    pago_vence_hoy: { tag: 'Pago vence hoy', variant: 'warning' as const, meta: 'hoy' },
  }[alerta.tipo] || { tag: '', variant: 'info' as const, meta: '' }

  return (
    <button
      onClick={() => onOpen?.({} as Prestacion)}
      className="w-full text-left flex items-center gap-3.5 px-5 py-3.5 border-b border-[var(--line)] bg-transparent cursor-pointer text-[13.5px]"
    >
      <div className={`w-1 self-stretch rounded ${cfg.variant === 'danger' ? 'bg-[var(--red)]' : 'bg-[var(--amber)]'}`} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold tracking-[-0.01em]">{alerta.institucion_nombre}</div>
        <div className="text-[12px] text-[var(--ink-3)] mt-0.5">
          {alerta.tipo_prestacion}{/* {p.paciente ? ` · ${p.paciente}` : ''} */}
        </div>
      </div>
      <div className="text-right">
        <div className="serif num text-[18px] tracking-[-0.01em]">
          {formatMonto(alerta.monto_bruto)}
        </div>
        <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
          {formatFecha(alerta.fecha_limite)}
        </div>
      </div>
      <span className={`badge ${cfg.variant} whitespace-nowrap`}>
        <span className="dot" />
        {cfg.tag}
      </span>
    </button>
  )
}

function ProyeccionChart({ prestaciones }: { prestaciones: Prestacion[] }) {
  const today = new Date()
  const months: Array<{ key: string; label: string; total: number; cobrado: number; proyectado: number }> = []
  for (let i = -2; i <= 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')
    months.push({ key, label, total: 0, cobrado: 0, proyectado: 0 })
  }

  prestaciones.forEach(p => {
    let fecha = p.fecha_pago_recibido || p.fecha_limite_pago
    if (!fecha && p.estado === 'realizada') {
      const base = p.fecha_limite_boleta || p.fecha_prestacion
      if (base) {
        const d = new Date(base)
        d.setDate(d.getDate() + 30)
        fecha = d.toISOString().split('T')[0]
      }
    }
    if (!fecha) return
    const key = fecha.substring(0, 7)
    const m = months.find(x => x.key === key)
    if (!m) return
    m.total += p.monto_neto
    if (p.estado === 'pagada') m.cobrado += p.monto_neto
    else m.proyectado += p.monto_neto
  })

  const max = Math.max(...months.map(m => m.total), 1)
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="flex items-end gap-3.5 h-[180px] px-1 pt-2">
      {months.map(m => {
        const cobH = (m.cobrado / max) * 140
        const proH = (m.proyectado / max) * 140
        const isCurrent = m.key === currentKey
        return (
          <div key={m.key} className="flex-1 flex flex-col items-stretch gap-2.5">
            <div className="flex-1 flex flex-col justify-end gap-0.5">
              <div className="text-[10.5px] text-[var(--ink-3)] text-center tabular-nums mb-1">
                {m.total > 0 ? formatMonto(m.total / 1000).replace('$', '') + 'k' : ''}
              </div>
              {proH > 0 && (
                <div
                  style={{ height: proH }}
                  className="bg-[var(--accent-weak)] rounded-t border border-dashed border-[var(--accent)] border-b-0"
                />
              )}
              {cobH > 0 && (
                <div
                  style={{ height: cobH }}
                  className={`bg-[var(--ink)] ${proH > 0 ? 'rounded-none' : 'rounded-t'}`}
                />
              )}
              {m.total === 0 && (
                <div className="h-0.5 bg-[var(--line)]" />
              )}
            </div>
            <div className={`text-center text-[11.5px] ${isCurrent ? 'font-semibold' : 'font-normal'} ${isCurrent ? 'text-[var(--ink)]' : 'text-[var(--ink-3)]'} capitalize pt-1.5 border-t border-[var(--line)] relative`}>
              {m.label}
              {isCurrent && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[var(--ink)]" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Stat({ eyebrow, value, sub, accent }: { eyebrow: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="px-5.5 py-5.5">
      <div className="eyebrow mb-3.5">{eyebrow}</div>
      <div className={`serif num text-[42px] leading-none tracking-[-0.02em] ${accent || 'text-[var(--ink)]'}`}>{value}</div>
      {sub && (
        <div className="text-[12px] text-[var(--ink-3)] mt-2.5">{sub}</div>
      )}
    </div>
  )
}

export default function DashboardClient({ nombre, prestaciones }: Props) {
  const today = new Date()
  const mesActual = getMesActual()
  const alertas = generarAlertas(prestaciones)

  const porCobrar = prestaciones
    .filter(p => p.estado !== 'pagada')
    .reduce((a, p) => a + p.monto_neto, 0)

  const cobradoMes = prestaciones
    .filter(p => p.estado === 'pagada' && p.fecha_pago_recibido?.startsWith(mesActual))
    .reduce((a, p) => a + p.monto_neto, 0)

  const sinBoleta = prestaciones.filter(p => p.estado === 'realizada').length
  const boletaEmitida = prestaciones.filter(p => p.estado === 'boleta_emitida').length

  const monthName = today.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  const primerNombre = nombre.split(' ')[0]

  return (
    <div className="flex flex-col gap-0">
      {/* Greeting */}
      <div className="flex items-end mb-7 gap-5 flex-wrap">
        <div className="flex-1 min-w-[320px]">
          <div className="eyebrow mb-1.5">{monthName}</div>
          <h1 className="m-0 font-serif text-[34px] tracking-[-0.02em] leading-[1.1]">
            Hola, {primerNombre}. <span className="text-[var(--ink-3)] italic">
              Tienes {alertas.length} asuntos por revisar.
            </span>
          </h1>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="btn btn-ghost">
            📅 Este mes
          </button>
          <Link href="/prestaciones/nueva" className="btn btn-primary">
            ➕ Nueva prestación
          </Link>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-[18px] overflow-hidden mb-6">
        <div className="bg-[var(--surface)] min-w-0">
          <Stat eyebrow="Por cobrar" value={formatMonto(porCobrar)} sub={`${sinBoleta + boletaEmitida} prestaciones abiertas`} />
        </div>
        <div className="bg-[var(--surface)] min-w-0">
          <Stat eyebrow="Cobrado este mes" value={formatMonto(cobradoMes)} sub="neto recibido" />
        </div>
        <div className="bg-[var(--surface)] min-w-0">
          <Stat eyebrow="Sin boleta" value={sinBoleta.toString()} sub="pendientes de emitir" accent="var(--amber)" />
        </div>
        <div className="bg-[var(--surface)] min-w-0">
          <Stat eyebrow="Boleta emitida" value={boletaEmitida.toString()} sub="esperando pago" accent="var(--accent-strong)" />
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alertas */}
        <div className="card">
          <div className="card-head">
            <h3>Alertas · {alertas.length}</h3>
            <div className="ml-auto">
              <Link href="/prestaciones" className="btn btn-ghost btn-sm">
                Ver cobranzas <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          <div>
            {alertas.length === 0 && (
              <div className="px-5 py-12 text-center text-[var(--ink-3)]">
                <div className="serif text-[24px] text-[var(--ink-2)] italic">
                  Todo al día
                </div>
                <div className="text-[12.5px] mt-1.5">
                  No hay boletas ni pagos por vencer
                </div>
              </div>
            )}
            {alertas.slice(0, 6).map(a => (
              <AlertaItem key={a.id} alerta={a} />
            ))}
          </div>
        </div>

        {/* Proyección */}
        <div className="card">
          <div className="card-head">
            <h3>Proyección de ingresos</h3>
            <span className="meta">6 meses · neto</span>
          </div>
          <div className="card-body">
            <ProyeccionChart prestaciones={prestaciones} />
            <div className="flex gap-4.5 mt-3.5 text-[11.5px] text-[var(--ink-3)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[var(--ink)] rounded-[2px]" />
                Cobrado
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[var(--accent-weak)] border border-dashed border-[var(--accent)] rounded-[2px]" />
                Proyectado
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Últimos movimientos */}
      <div className="mt-5">
        <div className="card">
          <div className="card-head">
            <h3>Últimos movimientos</h3>
            <div className="ml-auto">
              <Link href="/prestaciones" className="btn btn-ghost btn-sm">
                Ver todo
              </Link>
            </div>
          </div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-[var(--ink-3)] text-[11px] uppercase tracking-[0.08em]">
                <th className="text-left px-5 py-2.5 font-semibold">Fecha</th>
                <th className="text-left px-3 py-2.5 font-semibold">Institución</th>
                <th className="text-left px-3 py-2.5 font-semibold">Prestación</th>
                <th className="text-right px-3 py-2.5 font-semibold">Monto</th>
                <th className="text-left px-3 py-2.5 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[...prestaciones]
                .sort((a, b) => b.fecha_prestacion.localeCompare(a.fecha_prestacion))
                .slice(0, 5)
                .map(p => {
                  const estadoBadge =
                    p.estado === 'pagada'
                      ? 'success'
                      : p.estado === 'boleta_emitida'
                        ? 'info'
                        : 'warning'
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-[var(--line)] cursor-pointer hover:bg-[var(--bg)] transition-colors"
                    >
                      <td className="px-5 py-3 tabular-nums text-[var(--ink-2)]">
                        {new Date(p.fecha_prestacion).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-3 py-3">
                        <b className="font-medium">{p.institucion_nombre}</b>
                      </td>
                      <td className="px-3 py-3 text-[var(--ink-2)]">
                        {p.tipo_prestacion}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[16px]">
                        {formatMonto(p.monto_bruto)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`badge ${estadoBadge}`}>
                          <span className="dot" />
                          {p.estado === 'pagada'
                            ? 'Pagada'
                            : p.estado === 'boleta_emitida'
                              ? 'Boleta emitida'
                              : 'Sin boleta'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
