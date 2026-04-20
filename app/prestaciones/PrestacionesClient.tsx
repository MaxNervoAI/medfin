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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--ink)', margin: 0 }}>
            Cobranzas
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--ink-3)', marginTop: '4px', margin: 0 }}>
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              border: filtro === f.value ? '1px solid transparent' : '1px solid var(--line-2)',
              background: filtro === f.value ? 'var(--ink)' : 'var(--surface)',
              color: filtro === f.value ? '#fff' : 'var(--ink-2)',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '64px', paddingBottom: '64px', color: 'var(--ink-3)' }}>
          <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 500, margin: '8px 0 0 0' }}>Sin prestaciones</p>
          <p style={{ fontSize: '14px', margin: '0' }}>Registra tu primera prestación</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtradas.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--line)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '16px',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.borderColor = 'var(--line)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.institucion_nombre}
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--ink-3)', margin: '4px 0 0 0' }}>
                    {p.tipo_prestacion} · {formatFechaCorta(p.fecha_prestacion)}
                  </p>
                </div>
                {estadoBadge(p)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--ink)', margin: 0 }}>
                    {formatMonto(p.monto_bruto)}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '4px 0 0 0' }}>
                    Neto: {formatMonto(p.monto_neto)}
                  </p>
                </div>
                {p.estado === 'realizada' && p.fecha_limite_boleta && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: 0 }}>Emitir boleta</p>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: diasHasta(p.fecha_limite_boleta) < 0 ? 'var(--red)' : diasHasta(p.fecha_limite_boleta) <= 3 ? 'var(--amber)' : 'var(--ink-2)',
                      margin: '4px 0 0 0',
                    }}>
                      {formatFechaCorta(p.fecha_limite_boleta)}
                    </p>
                  </div>
                )}
                {p.estado === 'boleta_emitida' && p.fecha_limite_pago && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: 0 }}>Pago esperado</p>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: diasHasta(p.fecha_limite_pago) < 0 ? 'var(--red)' : 'var(--ink-2)',
                      margin: '4px 0 0 0',
                    }}>
                      {formatFechaCorta(p.fecha_limite_pago)}
                    </p>
                  </div>
                )}
                {p.estado === 'pagada' && p.fecha_pago_recibido && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: 0 }}>Pagado</p>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', margin: '4px 0 0 0' }}>
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
