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
          <h1 className="text-xl font-bold text-slate-900">Presupuesto</h1>
          <p className="text-sm text-slate-500">Proyección de ingresos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMesIdx(i => Math.min(i + 1, meses.length - 1))}
            disabled={mesIdx >= meses.length - 1}
            className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <span className="text-sm font-semibold text-slate-700 capitalize min-w-[110px] text-center">
            {getNombreMes(mesSeleccionado).split(' ')[0]}
          </span>
          <button
            onClick={() => setMesIdx(i => Math.max(i - 1, 0))}
            disabled={mesIdx <= 0}
            className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>
      </div>

      {delMes.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-medium">Sin prestaciones este mes</p>
          <p className="text-sm">Registra prestaciones para ver la proyección</p>
        </div>
      ) : (
        <>
          {/* Tarjeta principal */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white mb-5 shadow-sm">
            <p className="text-blue-100 text-sm mb-1">Total esperado (neto)</p>
            <p className="text-3xl font-bold mb-4">{formatMonto(proyeccion.totalNeto)}</p>

            {/* Barra de progreso */}
            <div className="bg-blue-500/40 rounded-full h-2.5 mb-2">
              <div
                className="bg-white rounded-full h-2.5 transition-all"
                style={{ width: `${Math.min(pctCobrado, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-blue-100">
              <span>Cobrado: {formatMonto(proyeccion.pagado)}</span>
              <span>{Math.round(pctCobrado)}%</span>
            </div>
          </div>

          {/* Cards secundarias */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-1">Monto bruto</p>
              <p className="text-lg font-bold text-slate-900">{formatMonto(proyeccion.totalBruto)}</p>
              <p className="text-xs text-slate-400">{delMes.length} prestaciones</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-1">Pendiente de cobrar</p>
              <p className="text-lg font-bold text-amber-600">{formatMonto(proyeccion.pendiente)}</p>
              <p className="text-xs text-slate-400">{delMes.filter(p => p.estado !== 'pagada').length} prestaciones</p>
            </div>
          </div>

          {/* Cobros recibidos en el mes */}
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 mb-5">
            <p className="text-xs text-green-600 font-medium mb-1">Dinero recibido en {getNombreMes(mesSeleccionado).split(' ')[0]}</p>
            <p className="text-2xl font-bold text-green-600">{formatMonto(cobradoEnMes)}</p>
            <p className="text-xs text-slate-400 mt-1">{pagadasDelMes.length} pagos ingresados a tu cuenta</p>
          </div>

          {/* Desglose por institución */}
          {instEntries.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Por institución</h2>
              <div className="flex flex-col gap-3">
                {instEntries.map(([nombre, datos]) => {
                  const pct = proyeccion.totalBruto > 0 ? (datos.bruto / proyeccion.totalBruto) * 100 : 0
                  return (
                    <div key={nombre}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{nombre}</p>
                          <p className="text-xs text-slate-400">{datos.count} prestaciones</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatMonto(datos.neto)}</p>
                          <p className="text-xs text-slate-400">neto</p>
                        </div>
                      </div>
                      <div className="bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 rounded-full h-1.5 transition-all"
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
