'use client'

import { useState } from 'react'
import { getMesActual, getNombreMes, formatMonto } from '@/lib/utils'
import type { Prestacion } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  prestaciones: Prestacion[]
}

function getMeses(prestaciones: Prestacion[]): string[] {
  const meses = new Set<string>()
  const hoy = getMesActual()
  meses.add(hoy)
  prestaciones.forEach(p => meses.add(p.fecha_prestacion.substring(0, 7)))
  return Array.from(meses).sort().reverse()
}

export default function PresupuestoClient({ prestaciones }: Props) {
  const meses = getMeses(prestaciones)
  const [mesIdx, setMesIdx] = useState(0)
  const mesSeleccionado = meses[mesIdx] ?? getMesActual()

  const delMes = prestaciones.filter(p => p.fecha_prestacion.startsWith(mesSeleccionado))
  const pagadasDelMes = prestaciones.filter(p => p.fecha_pago_recibido?.startsWith(mesSeleccionado))

  // Proyección: lo que se espera cobrar por prestaciones de este mes
  const proyeccion = {
    totalBruto: delMes.reduce((s, p) => s + p.monto_bruto, 0),
    totalNeto: delMes.reduce((s, p) => s + p.monto_neto, 0),
    pagado: delMes.filter(p => p.estado === 'pagada').reduce((s, p) => s + p.monto_neto, 0),
    pendiente: delMes.filter(p => p.estado !== 'pagada').reduce((s, p) => s + p.monto_neto, 0),
  }

  // Cobros reales recibidos en este mes (independiente de cuándo fue la prestación)
  const cobradoEnMes = pagadasDelMes.reduce((s, p) => s + p.monto_neto, 0)

  // Desglose por institución
  const porInstitucion = delMes.reduce<Record<string, { bruto: number; neto: number; count: number }>>((acc, p) => {
    if (!acc[p.institucion_nombre]) acc[p.institucion_nombre] = { bruto: 0, neto: 0, count: 0 }
    acc[p.institucion_nombre].bruto += p.monto_bruto
    acc[p.institucion_nombre].neto += p.monto_neto
    acc[p.institucion_nombre].count++
    return acc
  }, {})

  const instEntries = Object.entries(porInstitucion).sort((a, b) => b[1].bruto - a[1].bruto)
  const pctCobrado = proyeccion.totalNeto > 0 ? (proyeccion.pagado / proyeccion.totalNeto) * 100 : 0

  return (
    <div>
      {/* Header con navegación de meses */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--ink)', margin: 0 }}>
            Presupuesto
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--ink-3)', marginTop: '4px', margin: 0 }}>
            Proyección de ingresos
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setMesIdx(i => Math.min(i + 1, meses.length - 1))}
            disabled={mesIdx >= meses.length - 1}
            style={{
              padding: '8px',
              cursor: mesIdx >= meses.length - 1 ? 'not-allowed' : 'pointer',
              borderRadius: '12px',
              opacity: mesIdx >= meses.length - 1 ? 0.3 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (mesIdx < meses.length - 1) {
                (e.currentTarget).style.background = 'var(--bg)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background = 'transparent';
            }}
          >
            <ChevronLeft size={18} style={{ color: 'var(--ink-2)' }} />
          </button>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--ink-2)',
            textTransform: 'capitalize',
            minWidth: '110px',
            textAlign: 'center',
          }}>
            {getNombreMes(mesSeleccionado).split(' ')[0]}
          </span>
          <button
            onClick={() => setMesIdx(i => Math.max(i - 1, 0))}
            disabled={mesIdx <= 0}
            style={{
              padding: '8px',
              cursor: mesIdx <= 0 ? 'not-allowed' : 'pointer',
              borderRadius: '12px',
              opacity: mesIdx <= 0 ? 0.3 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (mesIdx > 0) {
                (e.currentTarget).style.background = 'var(--bg)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background = 'transparent';
            }}
          >
            <ChevronRight size={18} style={{ color: 'var(--ink-2)' }} />
          </button>
        </div>
      </div>

      {delMes.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '64px', paddingBottom: '64px', color: 'var(--ink-3)' }}>
          <p style={{ fontWeight: 500, margin: '0 0 8px 0' }}>Sin prestaciones este mes</p>
          <p style={{ fontSize: '14px', margin: '0' }}>Registra prestaciones para ver la proyección</p>
        </div>
      ) : (
        <>
          {/* Tarjeta principal */}
          <div style={{
            background: `linear-gradient(135deg, var(--accent), var(--accent-strong))`,
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            color: '#fff',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '0 0 4px 0' }}>
              Total esperado (neto)
            </p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              {formatMonto(proyeccion.totalNeto)}
            </p>

            {/* Barra de progreso */}
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '999px',
              height: '10px',
              marginBottom: '8px',
            }}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: '999px',
                  height: '10px',
                  transition: 'all 0.3s',
                  width: `${Math.min(pctCobrado, 100)}%`,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
              <span>Cobrado: {formatMonto(proyeccion.pagado)}</span>
              <span>{Math.round(pctCobrado)}%</span>
            </div>
          </div>

          {/* Cards secundarias */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div className="card" style={{ padding: '16px' }}>
              <p className="eyebrow" style={{ marginBottom: '8px' }}>Monto bruto</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--ink)', margin: '0' }}>
                {formatMonto(proyeccion.totalBruto)}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '4px 0 0 0' }}>
                {delMes.length} prestaciones
              </p>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <p className="eyebrow" style={{ marginBottom: '8px' }}>Pendiente de cobrar</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--amber)', margin: '0' }}>
                {formatMonto(proyeccion.pendiente)}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '4px 0 0 0' }}>
                {delMes.filter(p => p.estado !== 'pagada').length} prestaciones
              </p>
            </div>
          </div>

          {/* Cobros recibidos en el mes */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--green)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, margin: '0 0 4px 0' }}>
              Dinero recibido en {getNombreMes(mesSeleccionado).split(' ')[0]}
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--green)', margin: '0 0 4px 0' }}>
              {formatMonto(cobradoEnMes)}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: 0 }}>
              {pagadasDelMes.length} pagos ingresados a tu cuenta
            </p>
          </div>

          {/* Desglose por institución */}
          {instEntries.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-2)', marginBottom: '16px', margin: 0 }}>
                Por institución
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {instEntries.map(([nombre, datos]) => {
                  const pct = proyeccion.totalBruto > 0 ? (datos.bruto / proyeccion.totalBruto) * 100 : 0
                  return (
                    <div key={nombre}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-2)', margin: 0 }}>
                            {nombre}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '4px 0 0 0' }}>
                            {datos.count} prestaciones
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--ink)', margin: 0 }}>
                            {formatMonto(datos.neto)}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '4px 0 0 0' }}>neto</p>
                        </div>
                      </div>
                      <div style={{
                        background: 'var(--bg)',
                        borderRadius: '999px',
                        height: '6px',
                      }}>
                        <div
                          style={{
                            background: 'var(--ink)',
                            borderRadius: '999px',
                            height: '6px',
                            transition: 'all 0.3s',
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
