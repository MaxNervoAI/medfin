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
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 20px',
        borderBottom: '1px solid var(--line)',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '13.5px',
      }}
    >
      <div style={{
        width: '4px',
        alignSelf: 'stretch',
        borderRadius: '4px',
        background: cfg.variant === 'danger' ? 'var(--red)' : 'var(--amber)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>{alerta.institucion_nombre}</div>
        <div style={{ fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px' }}>
          {alerta.tipo_prestacion}{/* {p.paciente ? ` · ${p.paciente}` : ''} */}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="serif num" style={{ fontSize: '18px', letterSpacing: '-0.01em' }}>
          {formatMonto(alerta.monto_bruto)}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '2px' }}>
          {formatFecha(alerta.fecha_limite)}
        </div>
      </div>
      <span className={`badge ${cfg.variant}`} style={{ whiteSpace: 'nowrap' }}>
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
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '180px', padding: '8px 4px 0' }}>
      {months.map(m => {
        const cobH = (m.cobrado / max) * 140
        const proH = (m.proyectado / max) * 140
        const isCurrent = m.key === currentKey
        return (
          <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '2px' }}>
              <div style={{
                fontSize: '10.5px',
                color: 'var(--ink-3)',
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
                marginBottom: '4px',
              }}>
                {m.total > 0 ? formatMonto(m.total / 1000).replace('$', '') + 'k' : ''}
              </div>
              {proH > 0 && (
                <div style={{
                  height: proH,
                  background: 'var(--accent-weak)',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                  border: '1px dashed var(--accent)',
                  borderBottom: 0,
                }} />
              )}
              {cobH > 0 && (
                <div style={{
                  height: cobH,
                  background: 'var(--ink)',
                  borderRadius: proH > 0 ? 0 : '4px 4px 0 0',
                }} />
              )}
              {m.total === 0 && (
                <div style={{ height: '2px', background: 'var(--line)' }} />
              )}
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: '11.5px',
              fontWeight: isCurrent ? 600 : 400,
              color: isCurrent ? 'var(--ink)' : 'var(--ink-3)',
              textTransform: 'capitalize',
              paddingTop: '6px',
              borderTop: '1px solid var(--line)',
              position: 'relative',
            }}>
              {m.label}
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: '-1px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '2px',
                  background: 'var(--ink)',
                }} />
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
    <div style={{ padding: '22px 22px 20px' }}>
      <div className="eyebrow" style={{ marginBottom: '14px' }}>{eyebrow}</div>
      <div className="serif num" style={{
        fontSize: '42px',
        lineHeight: 1,
        letterSpacing: '-0.02em',
        color: accent || 'var(--ink)',
      }}>{value}</div>
      {sub && (
        <div style={{ fontSize: '12px', color: 'var(--ink-3)', marginTop: '10px' }}>{sub}</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '28px', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: '6px' }}>{monthName}</div>
          <h1 style={{
            margin: 0,
            fontFamily: "'Instrument Serif', serif",
            fontSize: '34px',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            Hola, {primerNombre}. <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>
              Tienes {alertas.length} asuntos por revisar.
            </span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button className="btn btn-ghost">
            📅 Este mes
          </button>
          <Link href="/prestaciones/nueva" className="btn btn-primary">
            ➕ Nueva prestación
          </Link>
        </div>
      </div>

      {/* Stat grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1px',
        background: 'var(--line)',
        border: '1px solid var(--line)',
        borderRadius: '18px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        <div style={{ background: 'var(--surface)', minWidth: 0 }}>
          <Stat eyebrow="Por cobrar" value={formatMonto(porCobrar)} sub={`${sinBoleta + boletaEmitida} prestaciones abiertas`} />
        </div>
        <div style={{ background: 'var(--surface)', minWidth: 0 }}>
          <Stat eyebrow="Cobrado este mes" value={formatMonto(cobradoMes)} sub="neto recibido" />
        </div>
        <div style={{ background: 'var(--surface)', minWidth: 0 }}>
          <Stat eyebrow="Sin boleta" value={sinBoleta.toString()} sub="pendientes de emitir" accent="var(--amber)" />
        </div>
        <div style={{ background: 'var(--surface)', minWidth: 0 }}>
          <Stat eyebrow="Boleta emitida" value={boletaEmitida.toString()} sub="esperando pago" accent="var(--accent-strong)" />
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px',
      }}>
        {/* Alertas */}
        <div className="card">
          <div className="card-head">
            <h3>Alertas · {alertas.length}</h3>
            <div style={{ marginLeft: 'auto' }}>
              <Link href="/prestaciones" className="btn btn-ghost btn-sm">
                Ver cobranzas <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          <div>
            {alertas.length === 0 && (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)' }}>
                <div className="serif" style={{ fontSize: '24px', color: 'var(--ink-2)', fontStyle: 'italic' }}>
                  Todo al día
                </div>
                <div style={{ fontSize: '12.5px', marginTop: '6px' }}>
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
            <div style={{ display: 'flex', gap: '18px', marginTop: '14px', fontSize: '11.5px', color: 'var(--ink-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: 'var(--ink)', borderRadius: '2px' }} />
                Cobrado
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: 'var(--accent-weak)', border: '1px dashed var(--accent)', borderRadius: '2px' }} />
                Proyectado
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Últimos movimientos */}
      <div style={{ marginTop: '20px' }}>
        <div className="card">
          <div className="card-head">
            <h3>Últimos movimientos</h3>
            <div style={{ marginLeft: 'auto' }}>
              <Link href="/prestaciones" className="btn btn-ghost btn-sm">
                Ver todo
              </Link>
            </div>
          </div>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}>
            <thead>
              <tr style={{
                color: 'var(--ink-3)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                <th style={{ textAlign: 'left', padding: '10px 20px', fontWeight: 600 }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Institución</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Prestación</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }}>Monto</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Estado</th>
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
                      style={{
                        borderTop: '1px solid var(--line)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={{
                        padding: '12px 20px',
                        fontVariantNumeric: 'tabular-nums',
                        color: 'var(--ink-2)',
                      }}>
                        {new Date(p.fecha_prestacion).toLocaleDateString('es-CL')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <b style={{ fontWeight: 500 }}>{p.institucion_nombre}</b>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--ink-2)' }}>
                        {p.tipo_prestacion}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: '16px',
                      }}>
                        {formatMonto(p.monto_bruto)}
                      </td>
                      <td style={{ padding: '12px' }}>
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
