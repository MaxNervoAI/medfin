'use client'

import Link from 'next/link'
import { generarAlertas, getMesActual } from '@/lib/utils'
import type { Prestacion, Alerta } from '@/types'
import { ArrowRight, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '@/components/ui/StatCard'
import { Money } from '@/components/ui/Money'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

interface Props {
  nombre: string
  prestaciones: Prestacion[]
}

function estadoBadge(estado: string) {
  if (estado === 'pagada')        return <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">Pagada</Badge>
  if (estado === 'boleta_emitida') return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Boleta emitida</Badge>
  return <Badge variant="outline" className="text-warning border-warning/40">Sin boleta</Badge>
}

function AlertaRow({ alerta }: { alerta: Alerta }) {
  const isUrgent = alerta.tipo.includes('vencida') || alerta.tipo.includes('vencido')
  const formatFecha = (d: string) =>
    new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })

  const tagMap: Record<string, string> = {
    boleta_vencida: 'Boleta vencida',
    boleta_vence_hoy: 'Emitir hoy',
    boleta_por_vencer: `Emitir en ${alerta.dias_restantes}d`,
    pago_vencido: 'Pago vencido',
    pago_vence_hoy: 'Pago vence hoy',
  }

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className={`shrink-0 size-7 rounded-lg flex items-center justify-center ${isUrgent ? 'bg-destructive/10' : 'bg-warning/10'}`}>
        {isUrgent
          ? <AlertTriangle className="size-3.5 text-destructive" />
          : <Clock className="size-3.5 text-warning" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{alerta.institucion_nombre}</p>
        <p className="text-xs text-muted-foreground truncate">{alerta.tipo_prestacion}</p>
      </div>
      <div className="text-right shrink-0">
        <Money value={alerta.monto_bruto} size="sm" />
        <p className="text-[10px] text-muted-foreground">{formatFecha(alerta.fecha_limite)}</p>
      </div>
      <Badge
        variant={isUrgent ? 'destructive' : 'outline'}
        className={`text-[10px] shrink-0 ${!isUrgent ? 'text-warning border-warning/40' : ''}`}
      >
        {tagMap[alerta.tipo] ?? alerta.tipo}
      </Badge>
    </div>
  )
}

function MiniBarChart({ prestaciones }: { prestaciones: Prestacion[] }) {
  const today = new Date()
  const months: Array<{ key: string; label: string; cobrado: number; proyectado: number }> = []
  for (let i = -2; i <= 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')
    months.push({ key, label, cobrado: 0, proyectado: 0 })
  }
  prestaciones.forEach(p => {
    let fecha = p.fecha_pago_recibido || p.fecha_limite_pago
    if (!fecha && p.estado === 'realizada') {
      const base = p.fecha_limite_boleta || p.fecha_prestacion
      if (base) {
        const d = new Date(base); d.setDate(d.getDate() + 30)
        fecha = d.toISOString().split('T')[0]
      }
    }
    if (!fecha) return
    const m = months.find(x => x.key === fecha!.substring(0, 7))
    if (!m) return
    if (p.estado === 'pagada') m.cobrado += p.monto_neto
    else m.proyectado += p.monto_neto
  })
  const max = Math.max(...months.map(m => m.cobrado + m.proyectado), 1)
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2 h-36 pt-2">
        {months.map(m => {
          const total = m.cobrado + m.proyectado
          const cobH = (m.cobrado / max) * 120
          const proH = (m.proyectado / max) * 120
          const isCurrent = m.key === currentKey
          return (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground font-mono tabular-nums">
                {total > 0 ? `${Math.round(total / 1000)}k` : ''}
              </span>
              <div className="w-full flex flex-col justify-end gap-px" style={{ height: 120 }}>
                {proH > 0 && (
                  <div
                    className="w-full rounded-t-sm border border-dashed border-primary/40 bg-primary/10"
                    style={{ height: proH }}
                  />
                )}
                {cobH > 0 && (
                  <div
                    className={`w-full bg-primary ${proH > 0 ? '' : 'rounded-t-sm'}`}
                    style={{ height: cobH }}
                  />
                )}
                {total === 0 && <div className="w-full h-px bg-border" />}
              </div>
              <span className={`text-[10px] capitalize ${isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {m.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary inline-block" /> Cobrado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary/10 border border-dashed border-primary/40 inline-block" /> Proyectado
        </span>
      </div>
    </div>
  )
}

export default function DashboardClient({ nombre, prestaciones }: Props) {
  const mesActual = getMesActual()
  const alertas = generarAlertas(prestaciones)

  // Helper to calculate monto_neto with fallback for NaN values
  const getMontoNeto = (p: Prestacion) => {
    if (isNaN(p.monto_neto)) {
      const retencionPct = p.retencion_pct || 0
      return Math.round(p.monto_bruto * (1 - retencionPct / 100))
    }
    return p.monto_neto
  }

  const porCobrar = prestaciones.filter(p => p.estado !== 'pagada').reduce((a, p) => a + getMontoNeto(p), 0)
  const cobradoMes = prestaciones
    .filter(p => p.estado === 'pagada' && p.fecha_pago_recibido?.startsWith(mesActual))
    .reduce((a, p) => a + getMontoNeto(p), 0)
  const sinBoleta = prestaciones.filter(p => p.estado === 'realizada').length
  const boletaEmitida = prestaciones.filter(p => p.estado === 'boleta_emitida').length

  const primerNombre = nombre.split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Hola, ${primerNombre}`}
        subtitle={alertas.length > 0 ? `${alertas.length} ${alertas.length === 1 ? 'alerta pendiente' : 'alertas pendientes'} este mes` : 'Todo al día · sin alertas pendientes'}
        actions={
          <Button asChild size="sm">
            <Link href="/prestaciones/nueva">Nueva prestación</Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          eyebrow="Por cobrar"
          value={<Money value={porCobrar} size="xl" />}
          sub={`${sinBoleta + boletaEmitida} prestaciones abiertas`}
        />
        <StatCard
          eyebrow="Cobrado este mes"
          value={<Money value={cobradoMes} size="xl" />}
          sub="neto recibido"
          accent="primary"
        />
        <StatCard
          eyebrow="Sin boleta"
          value={<span className="font-serif text-[2.6rem] leading-none tracking-tight text-warning">{sinBoleta}</span>}
          sub="pendientes de emitir"
          accent="warning"
        />
        <StatCard
          eyebrow="Boleta emitida"
          value={<span className="font-serif text-[2.6rem] leading-none tracking-tight text-primary">{boletaEmitida}</span>}
          sub="esperando pago"
          accent="primary"
        />
      </div>

      {/* Two-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alertas */}
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Alertas · {alertas.length}</CardTitle>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
              <Link href="/prestaciones">Ver cobranzas <ArrowRight className="size-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {alertas.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 />}
                title="Todo al día"
                description="No hay boletas ni pagos por vencer"
                className="py-8"
              />
            ) : (
              <div className="divide-y divide-border">
                {alertas.slice(0, 6).map(a => (
                  <AlertaRow key={a.id} alerta={a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proyección */}
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Proyección de ingresos</CardTitle>
            <span className="text-xs text-muted-foreground">6 meses · neto</span>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <MiniBarChart prestaciones={prestaciones} />
          </CardContent>
        </Card>
      </div>

      {/* Recent movements */}
      <Card className="border-border/60">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">Últimos movimientos</CardTitle>
          <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
            <Link href="/prestaciones">Ver todo</Link>
          </Button>
        </CardHeader>
        <Separator />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="eyebrow text-left px-5 py-2.5">Fecha</th>
                <th className="eyebrow text-left px-3 py-2.5">Institución</th>
                <th className="eyebrow text-left px-3 py-2.5 hidden sm:table-cell">Prestación</th>
                <th className="eyebrow text-right px-3 py-2.5">Monto</th>
                <th className="eyebrow text-left px-3 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...prestaciones]
                .sort((a, b) => b.fecha_prestacion.localeCompare(a.fecha_prestacion))
                .slice(0, 5)
                .map(p => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono tabular-nums whitespace-nowrap">
                      {new Date(p.fecha_prestacion).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-3 py-3 font-medium text-sm">{p.institucion_nombre}</td>
                    <td className="px-3 py-3 text-muted-foreground text-sm hidden sm:table-cell">{p.tipo_prestacion}</td>
                    <td className="px-3 py-3 text-right">
                      <Money value={p.monto_bruto} size="sm" />
                    </td>
                    <td className="px-3 py-3">{estadoBadge(p.estado)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {prestaciones.length === 0 && (
            <EmptyState title="Sin prestaciones" description="Agrega tu primera prestación para ver los movimientos" className="py-8" />
          )}
        </div>
      </Card>
    </div>
  )
}
