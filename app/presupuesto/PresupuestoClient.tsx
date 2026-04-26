'use client'

import { useState } from 'react'
import { getMesActual, getNombreMes } from '@/lib/utils'
import type { Prestacion } from '@/types'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Money } from '@/components/ui/Money'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

interface Props {
  prestaciones: Prestacion[]
}

function getMeses(prestaciones: Prestacion[]): string[] {
  const meses = new Set<string>()
  meses.add(getMesActual())
  prestaciones.forEach(p => meses.add(p.fecha_prestacion.substring(0, 7)))
  return Array.from(meses).sort().reverse()
}

export default function PresupuestoClient({ prestaciones }: Props) {
  const meses = getMeses(prestaciones)
  const [mesIdx, setMesIdx] = useState(0)
  const mesSeleccionado = meses[mesIdx] ?? getMesActual()

  const delMes = prestaciones.filter(p => p.fecha_prestacion.startsWith(mesSeleccionado))
  const pagadasDelMes = prestaciones.filter(p => p.fecha_pago_recibido?.startsWith(mesSeleccionado))

  const proyeccion = {
    totalBruto: delMes.reduce((s, p) => s + p.monto_bruto, 0),
    totalNeto: delMes.reduce((s, p) => s + p.monto_neto, 0),
    pagado: delMes.filter(p => p.estado === 'pagada').reduce((s, p) => s + p.monto_neto, 0),
    pendiente: delMes.filter(p => p.estado !== 'pagada').reduce((s, p) => s + p.monto_neto, 0),
  }

  const cobradoEnMes = pagadasDelMes.reduce((s, p) => s + p.monto_neto, 0)

  const porInstitucion = delMes.reduce<Record<string, { bruto: number; neto: number; count: number }>>((acc, p) => {
    if (!acc[p.institucion_nombre]) acc[p.institucion_nombre] = { bruto: 0, neto: 0, count: 0 }
    acc[p.institucion_nombre].bruto += p.monto_bruto
    acc[p.institucion_nombre].neto += p.monto_neto
    acc[p.institucion_nombre].count++
    return acc
  }, {})

  const instEntries = Object.entries(porInstitucion).sort((a, b) => b[1].bruto - a[1].bruto)
  const pctCobrado = proyeccion.totalNeto > 0 ? Math.min((proyeccion.pagado / proyeccion.totalNeto) * 100, 100) : 0
  const mesLabel = getNombreMes(mesSeleccionado).split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Presupuesto"
        subtitle="Proyección de ingresos por mes"
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setMesIdx(i => Math.min(i + 1, meses.length - 1))}
              disabled={mesIdx >= meses.length - 1}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground capitalize min-w-[100px] text-center">
              {mesLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setMesIdx(i => Math.max(i - 1, 0))}
              disabled={mesIdx <= 0}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      {delMes.length === 0 ? (
        <EmptyState
          icon={<TrendingUp />}
          title="Sin prestaciones este mes"
          description="Registra prestaciones para ver la proyección"
        />
      ) : (
        <>
          {/* Hero card */}
          <Card className="bg-primary text-primary-foreground border-0 shadow-md">
            <CardContent className="pt-5 pb-4">
              <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wide mb-1">
                Total esperado · neto
              </p>
              <Money value={proyeccion.totalNeto} size="xl" className="text-primary-foreground" />
              <div className="mt-4 space-y-1.5">
                <Progress
                  value={pctCobrado}
                  className="h-2 bg-primary-foreground/20 [&>div]:bg-primary-foreground"
                />
                <div className="flex justify-between text-xs text-primary-foreground/70">
                  <span>Cobrado: <Money value={proyeccion.pagado} size="sm" className="text-primary-foreground/90" /></span>
                  <span>{Math.round(pctCobrado)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              eyebrow="Monto bruto"
              value={<Money value={proyeccion.totalBruto} size="lg" />}
              sub={`${delMes.length} prestaciones`}
            />
            <StatCard
              eyebrow="Pendiente de cobrar"
              value={<Money value={proyeccion.pendiente} size="lg" className="text-warning" />}
              sub={`${delMes.filter(p => p.estado !== 'pagada').length} pendientes`}
              accent="warning"
            />
          </div>

          {/* Cash received */}
          <Card className="border-success/30 bg-success/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-success uppercase tracking-wide mb-1">
                Dinero recibido en {mesLabel}
              </p>
              <Money value={cobradoEnMes} size="xl" className="text-success" />
              <p className="text-xs text-muted-foreground mt-1">
                {pagadasDelMes.length} {pagadasDelMes.length === 1 ? 'pago' : 'pagos'} ingresados a tu cuenta
              </p>
            </CardContent>
          </Card>

          {/* By institution */}
          {instEntries.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Por institución</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 flex flex-col gap-4">
                {instEntries.map(([nombre, datos]) => {
                  const pct = proyeccion.totalBruto > 0 ? (datos.bruto / proyeccion.totalBruto) * 100 : 0
                  return (
                    <div key={nombre} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-foreground">{nombre}</p>
                          <p className="text-xs text-muted-foreground">{datos.count} prestaciones</p>
                        </div>
                        <div className="text-right">
                          <Money value={datos.neto} size="sm" />
                          <p className="text-xs text-muted-foreground">neto</p>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
