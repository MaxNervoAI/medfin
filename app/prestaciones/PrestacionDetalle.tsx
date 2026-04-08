'use client'

import { useState } from 'react'
import { X, CheckCircle, FileCheck, Trash2 } from 'lucide-react'
import type { Prestacion } from '@/types'
import { formatMonto, formatFechaCorta } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface Props {
  prestacion: Prestacion
  onClose: () => void
  onBoletaEmitida: (p: Prestacion, fecha: string) => Promise<void>
  onPagada: (p: Prestacion, fecha: string) => Promise<void>
  onEliminar: (id: string) => Promise<void>
}

export default function PrestacionDetalle({ prestacion: p, onClose, onBoletaEmitida, onPagada, onEliminar }: Props) {
  const [loading, setLoading] = useState(false)
  const [fechaAccion, setFechaAccion] = useState(new Date().toISOString().split('T')[0])
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleBoletaEmitida() {
    setLoading(true)
    await onBoletaEmitida(p, fechaAccion)
    setLoading(false)
  }

  async function handlePagada() {
    setLoading(true)
    await onPagada(p, fechaAccion)
    setLoading(false)
  }

  async function handleEliminar() {
    setLoading(true)
    await onEliminar(p.id)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl p-6 pb-safe max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{p.institucion_nombre}</h2>
            <p className="text-slate-500 text-sm">{p.tipo_prestacion} · {formatFechaCorta(p.fecha_prestacion)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Montos */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 text-sm">Monto bruto</span>
            <span className="font-bold text-slate-900 text-lg">{formatMonto(p.monto_bruto)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 text-sm">Retención {p.retencion_pct}%</span>
            <span className="text-red-500 text-sm">- {formatMonto(p.monto_retencion)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-2">
            <span className="font-semibold text-slate-700 text-sm">Neto a recibir</span>
            <span className="font-bold text-green-600">{formatMonto(p.monto_neto)}</span>
          </div>
        </div>

        {/* Info adicional */}
        <div className="flex flex-col gap-2 mb-5 text-sm">
          {p.es_turno && p.horas && p.valor_hora && (
            <div className="flex justify-between">
              <span className="text-slate-500">Turno</span>
              <span className="text-slate-700">{p.horas}h × {formatMonto(p.valor_hora)}/h</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Tipo documento</span>
            <span className="text-slate-700 capitalize">{p.tipo_documento}</span>
          </div>
          {p.fecha_limite_boleta && (
            <div className="flex justify-between">
              <span className="text-slate-500">Límite boleta</span>
              <span className="text-slate-700">{formatFechaCorta(p.fecha_limite_boleta)}</span>
            </div>
          )}
          {p.fecha_boleta_emitida && (
            <div className="flex justify-between">
              <span className="text-slate-500">Boleta emitida</span>
              <span className="text-slate-700">{formatFechaCorta(p.fecha_boleta_emitida)}</span>
            </div>
          )}
          {p.fecha_limite_pago && (
            <div className="flex justify-between">
              <span className="text-slate-500">Límite pago</span>
              <span className="text-slate-700">{formatFechaCorta(p.fecha_limite_pago)}</span>
            </div>
          )}
          {p.fecha_pago_recibido && (
            <div className="flex justify-between">
              <span className="text-slate-500">Pago recibido</span>
              <span className="text-green-600 font-medium">{formatFechaCorta(p.fecha_pago_recibido)}</span>
            </div>
          )}
          {p.notas && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Notas</span>
              <span className="text-slate-700 text-right">{p.notas}</span>
            </div>
          )}
        </div>

        {/* Acciones según estado */}
        {p.estado !== 'pagada' && (
          <div className="flex flex-col gap-3 mb-5">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Fecha de la acción</label>
              <input
                type="date"
                value={fechaAccion}
                onChange={e => setFechaAccion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {p.estado === 'realizada' && (
              <Button onClick={handleBoletaEmitida} loading={loading} className="w-full">
                <FileCheck size={16} /> Marcar boleta como emitida
              </Button>
            )}

            {p.estado === 'boleta_emitida' && (
              <Button onClick={handlePagada} loading={loading} className="w-full">
                <CheckCircle size={16} /> Marcar como pagada
              </Button>
            )}
          </div>
        )}

        {/* Eliminar */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center justify-center gap-2 text-red-500 text-sm py-2.5 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 size={15} /> Eliminar prestación
          </button>
        ) : (
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-sm text-red-700 font-medium mb-3">¿Confirmar eliminación?</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={handleEliminar} loading={loading} className="flex-1">
                Eliminar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
