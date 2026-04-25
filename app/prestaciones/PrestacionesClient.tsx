'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatMonto, formatFechaCorta, diasHasta } from '@/lib/utils'
import type { Prestacion, EstadoPrestacion } from '@/types'
import Badge from '@/components/ui/Badge'
import PrestacionDetalle from './PrestacionDetalle'

const FILTROS: { value: EstadoPrestacion | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'realizada', label: 'Sin boleta' },
  { value: 'boleta_emitida', label: 'Pendiente pago' },
  { value: 'pagada', label: 'Pagadas' },
]

function estadoBadge(prestacion: Prestacion) {
  if (prestacion.estado === 'pagada') {
    return <Badge variant="success">Pagada</Badge>
  }
  if (prestacion.estado === 'boleta_emitida') {
    if (prestacion.fecha_limite_pago) {
      const dias = diasHasta(prestacion.fecha_limite_pago)
      if (dias < 0) return <Badge variant="danger">Pago vencido</Badge>
      if (dias <= 3) return <Badge variant="warning">Vence pronto</Badge>
    }
    return <Badge variant="info">Boleta emitida</Badge>
  }
  // realizada
  if (prestacion.fecha_limite_boleta) {
    const dias = diasHasta(prestacion.fecha_limite_boleta)
    if (dias < 0) return <Badge variant="danger">Boleta vencida</Badge>
    if (dias <= 3) return <Badge variant="warning">Emitir pronto</Badge>
  }
  return <Badge variant="default">Sin boleta</Badge>
}

export default function PrestacionesClient({ prestaciones: init }: { prestaciones: Prestacion[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [prestaciones, setPrestaciones] = useState(init)
  const [filtro, setFiltro] = useState<EstadoPrestacion | 'todas'>('todas')
  const [selected, setSelected] = useState<Prestacion | null>(null)

  const filtradas = prestaciones.filter(p => filtro === 'todas' || p.estado === filtro)

  async function marcarBoletaEmitida(prestacion: Prestacion, fecha: string) {
    const { error } = await supabase
      .from('prestaciones')
      .update({
        estado: 'boleta_emitida',
        fecha_boleta_emitida: fecha,
        // fecha_limite_pago se debe recalcular — lo hacemos en cliente por ahora
        fecha_limite_pago: calcularFechaLimitePagoDesdeRegla(prestacion, fecha),
      })
      .eq('id', prestacion.id)

    if (!error) {
      setPrestaciones(prev =>
        prev.map(p => p.id === prestacion.id
          ? {
              ...p,
              estado: 'boleta_emitida',
              fecha_boleta_emitida: fecha,
              fecha_limite_pago: calcularFechaLimitePagoDesdeRegla(prestacion, fecha),
            }
          : p
        )
      )
      setSelected(null)
      router.refresh()
    }
  }

  async function marcarPagada(prestacion: Prestacion, fecha: string) {
    const { error } = await supabase
      .from('prestaciones')
      .update({ estado: 'pagada', fecha_pago_recibido: fecha })
      .eq('id', prestacion.id)

    if (!error) {
      setPrestaciones(prev =>
        prev.map(p => p.id === prestacion.id
          ? { ...p, estado: 'pagada', fecha_pago_recibido: fecha }
          : p
        )
      )
      setSelected(null)
      router.refresh()
    }
  }

  async function eliminarPrestacion(id: string) {
    await supabase.from('prestaciones').delete().eq('id', id)
    setPrestaciones(prev => prev.filter(p => p.id !== id))
    setSelected(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--ink)] m-0">
            Cobranzas
          </h1>
          <p className="text-[14px] text-[var(--ink-3)] mt-1 m-0">
            {prestaciones.length} prestaciones registradas
          </p>
        </div>
        <Link href="/prestaciones/nueva">
          <button className="btn btn-primary btn-sm">
            <Plus size={16} /> Nueva
          </button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
              filtro === f.value
                ? 'bg-[var(--ink)] text-white border border-transparent'
                : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line-2)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-[var(--ink-3)]">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium mt-2 mb-0">Sin prestaciones</p>
          <p className="text-[14px] m-0">Registra tu primera prestación</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--line)] shadow-sm px-4 py-4 text-left w-full cursor-pointer transition-all duration-150 hover:border-[var(--accent)]"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--ink)] m-0 overflow-hidden text-ellipsis">
                    {p.institucion_nombre}
                  </p>
                  <p className="text-[14px] text-[var(--ink-3)] mt-1 mb-0">
                    {p.tipo_prestacion} · {formatFechaCorta(p.fecha_prestacion)}
                  </p>
                </div>
                {estadoBadge(p)}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[18px] font-bold text-[var(--ink)] m-0">
                    {formatMonto(p.monto_bruto)}
                  </p>
                  <p className="text-[12px] text-[var(--ink-3)] mt-1 mb-0">
                    Neto: {formatMonto(p.monto_neto)}
                  </p>
                </div>
                {p.estado === 'realizada' && p.fecha_limite_boleta && (
                  <div className="text-right">
                    <p className="text-[12px] text-[var(--ink-3)] m-0">Emitir boleta</p>
                    <p className={`text-[12px] font-semibold mt-1 mb-0 ${
                      diasHasta(p.fecha_limite_boleta) < 0 ? 'text-[var(--red)]' :
                      diasHasta(p.fecha_limite_boleta) <= 3 ? 'text-[var(--amber)]' :
                      'text-[var(--ink-2)]'
                    }`}>
                      {formatFechaCorta(p.fecha_limite_boleta)}
                    </p>
                  </div>
                )}
                {p.estado === 'boleta_emitida' && p.fecha_limite_pago && (
                  <div className="text-right">
                    <p className="text-[12px] text-[var(--ink-3)] m-0">Pago esperado</p>
                    <p className={`text-[12px] font-semibold mt-1 mb-0 ${
                      diasHasta(p.fecha_limite_pago) < 0 ? 'text-[var(--red)]' : 'text-[var(--ink-2)]'
                    }`}>
                      {formatFechaCorta(p.fecha_limite_pago)}
                    </p>
                  </div>
                )}
                {p.estado === 'pagada' && p.fecha_pago_recibido && (
                  <div className="text-right">
                    <p className="text-[12px] text-[var(--ink-3)] m-0">Pagado</p>
                    <p className="text-[12px] font-semibold text-[var(--green)] mt-1 mb-0">
                      {formatFechaCorta(p.fecha_pago_recibido)}
                    </p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Panel de detalle */}
      {selected && (
        <PrestacionDetalle
          prestacion={selected}
          onClose={() => setSelected(null)}
          onBoletaEmitida={marcarBoletaEmitida}
          onPagada={marcarPagada}
          onEliminar={eliminarPrestacion}
        />
      )}
    </div>
  )
}

function calcularFechaLimitePagoDesdeRegla(prestacion: Prestacion, fechaBoleta: string): string | null {
  // Sin regla disponible aquí — usamos 30 días por defecto
  // En producción esto vendría del contexto de la regla
  const d = new Date(fechaBoleta)
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}
