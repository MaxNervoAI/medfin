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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--ink)] m-0">
            Presupuesto
          </h1>
          <p className="text-[14px] text-[var(--ink-3)] mt-1 m-0">
            Proyección de ingresos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMesIdx(i => Math.min(i + 1, meses.length - 1))}
            disabled={mesIdx >= meses.length - 1}
            className={`p-2 rounded-xl transition-all duration-150 ${
              mesIdx >= meses.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--bg)]'
            }`}
          >
            <ChevronLeft size={18} className="text-[var(--ink-2)]" />
          </button>
          <span className="text-[14px] font-semibold text-[var(--ink-2)] capitalize min-w-[110px] text-center">
            {getNombreMes(mesSeleccionado).split(' ')[0]}
          </span>
          <button
            onClick={() => setMesIdx(i => Math.max(i - 1, 0))}
            disabled={mesIdx <= 0}
            className={`p-2 rounded-xl transition-all duration-150 ${
              mesIdx <= 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--bg)]'
            }`}
          >
            <ChevronRight size={18} className="text-[var(--ink-2)]" />
          </button>
        </div>
      </div>

      {delMes.length === 0 ? (
        <div className="text-center py-16 text-[var(--ink-3)]">
          <p className="font-medium mb-2 mt-0">Sin prestaciones este mes</p>
          <p className="text-[14px] m-0">Registra prestaciones para ver la proyección</p>
        </div>
      ) : (
        <>
          {/* Tarjeta principal */}
          <div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] rounded-[var(--radius-lg)] px-5 py-5 text-white mb-5 shadow-lg">
            <p className="text-white/80 text-[14px] mb-1 mt-0">
              Total esperado (neto)
            </p>
            <p className="text-[28px] font-bold mb-4 mt-0">
              {formatMonto(proyeccion.totalNeto)}
            </p>

            {/* Barra de progreso */}
            <div className="bg-white/20 rounded-full h-2.5 mb-2">
              <div
                className="bg-white rounded-full h-2.5 transition-all duration-300"
                style={{ width: `${Math.min(pctCobrado, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[12px] text-white/80">
              <span>Cobrado: {formatMonto(proyeccion.pagado)}</span>
              <span>{Math.round(pctCobrado)}%</span>
            </div>
          </div>

          {/* Cards secundarias */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="card px-4 py-4">
              <p className="eyebrow mb-2">Monto bruto</p>
              <p className="text-[18px] font-bold text-[var(--ink)] m-0">
                {formatMonto(proyeccion.totalBruto)}
              </p>
              <p className="text-[12px] text-[var(--ink-3)] mt-1 mb-0">
                {delMes.length} prestaciones
              </p>
            </div>
            <div className="card px-4 py-4">
              <p className="eyebrow mb-2">Pendiente de cobrar</p>
              <p className="text-[18px] font-bold text-[var(--amber)] m-0">
                {formatMonto(proyeccion.pendiente)}
              </p>
              <p className="text-[12px] text-[var(--ink-3)] mt-1 mb-0">
                {delMes.filter(p => p.estado !== 'pagada').length} prestaciones
              </p>
            </div>
          </div>

          {/* Cobros recibidos en el mes */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--green)] shadow-sm px-4 py-4 mb-5">
            <p className="text-[12px] text-[var(--green)] font-semibold mb-1 mt-0">
              Dinero recibido en {getNombreMes(mesSeleccionado).split(' ')[0]}
            </p>
            <p className="text-[24px] font-bold text-[var(--green)] mb-1 mt-0">
              {formatMonto(cobradoEnMes)}
            </p>
            <p className="text-[12px] text-[var(--ink-3)] m-0">
              {pagadasDelMes.length} pagos ingresados a tu cuenta
            </p>
          </div>

          {/* Desglose por institución */}
          {instEntries.length > 0 && (
            <div className="card px-4 py-4">
              <h2 className="text-[14px] font-semibold text-[var(--ink-2)] mb-4 mt-0">
                Por institución
              </h2>
              <div className="flex flex-col gap-3">
                {instEntries.map(([nombre, datos]) => {
                  const pct = proyeccion.totalBruto > 0 ? (datos.bruto / proyeccion.totalBruto) * 100 : 0
                  return (
                    <div key={nombre}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <p className="text-[14px] font-medium text-[var(--ink-2)] m-0">
                            {nombre}
                          </p>
                          <p className="text-[12px] text-[var(--ink-3)] mt-1 mb-0">
                            {datos.count} prestaciones
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-bold text-[var(--ink)] m-0">
                            {formatMonto(datos.neto)}
                          </p>
                          <p className="text-[12px] text-[var(--ink-3)] mt-1 mb-0">neto</p>
                        </div>
                      </div>
                      <div className="bg-[var(--bg)] rounded-full h-1.5">
                        <div
                          className="bg-[var(--ink)] rounded-full h-1.5 transition-all duration-300"
                          style={{ width: `${pct}%` }}
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
