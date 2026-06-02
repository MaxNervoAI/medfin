'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/Money'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from 'sonner'
import { Zap, CheckCircle2, TrendingUp, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Prestacion } from '@/types'

const PLATFORM_FEE_PCT = 5

interface Props {
  open: boolean
  onClose: () => void
  prestaciones: Prestacion[]
}

function getMontoNeto(p: Prestacion): number {
  if (isNaN(p.monto_neto) || p.monto_neto === null) {
    const retencionPct = p.retencion_pct || 0
    return Math.round(p.monto_bruto * (1 - retencionPct / 100))
  }
  return p.monto_neto
}

function formatFecha(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

function estadoLabel(estado: string) {
  if (estado === 'boleta_emitida') return { label: 'Boleta emitida', className: 'bg-primary/10 text-primary border-primary/20' }
  return { label: 'Sin boleta', className: 'bg-warning/10 text-warning border-warning/30' }
}

export default function PagoAnticipadoModal({ open, onClose, prestaciones }: Props) {
  const pendientes = useMemo(
    () => prestaciones.filter(p => p.estado === 'realizada' || p.estado === 'boleta_emitida'),
    [prestaciones]
  )

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === pendientes.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendientes.map(p => p.id)))
    }
  }

  const totalNeto = useMemo(
    () => pendientes.filter(p => selected.has(p.id)).reduce((sum, p) => sum + getMontoNeto(p), 0),
    [pendientes, selected]
  )
  const comision = Math.round(totalNeto * PLATFORM_FEE_PCT / 100)
  const recibirias = totalNeto - comision

  function handleSubmit() {
    setSubmitted(true)
    setTimeout(() => {
      toast.success('Solicitud enviada — te contactaremos en 24hs', { duration: 4000 })
      setSubmitted(false)
      setSelected(new Set())
      onClose()
    }, 800)
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelected(new Set())
      setSubmitted(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="size-4 text-primary" />
            </div>
            <DialogTitle className="text-xl tracking-tight">Pago anticipado</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Adelantamos el cobro de tus prestaciones. Selecciona las que quieras incluir
            y te transferimos hoy, descontando un <strong className="text-foreground">5% de comisión</strong>.
          </p>
        </DialogHeader>

        <Separator className="shrink-0" />

        {/* Body: prestacion list */}
        <div className="flex-1 overflow-y-auto">
          {pendientes.length === 0 ? (
            <div className="px-6 py-10">
              <EmptyState
                icon={<TrendingUp />}
                title="Sin prestaciones pendientes"
                description="No tienes prestaciones activas para incluir en un pago anticipado"
              />
            </div>
          ) : (
            <div className="px-6 py-4 flex flex-col gap-2">
              {/* Select all */}
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center gap-2 text-xs text-primary hover:underline self-start mb-1"
              >
                {selected.size === pendientes.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>

              {pendientes.map(p => {
                const neto = getMontoNeto(p)
                const isSelected = selected.has(p.id)
                const estado = estadoLabel(p.estado)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={cn(
                      'w-full text-left rounded-xl border p-4 transition-all duration-150',
                      'flex items-center gap-4',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-background'
                    )}>
                      {isSelected && <CheckCircle2 className="size-3.5 text-primary-foreground" strokeWidth={3} />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{p.institucion_nombre}</p>
                        <Badge className={cn('text-[10px] h-4 px-1.5', estado.className)}>
                          {estado.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <Clock className="size-3 shrink-0" />
                        <span>{formatFecha(p.fecha_prestacion)}</span>
                        <span>·</span>
                        <span className="truncate">{p.tipo_prestacion}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <Money value={neto} size="sm" className="font-semibold" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">neto</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Simulation panel */}
        {pendientes.length > 0 && (
          <>
            <Separator className="shrink-0" />
            <div className="px-6 py-4 bg-muted/30 shrink-0">
              {selected.size === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-1">
                  Selecciona al menos una prestación para ver la simulación
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total seleccionado ({selected.size} prestación{selected.size !== 1 ? 'es' : ''})
                    </span>
                    <Money value={totalNeto} size="sm" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Comisión plataforma ({PLATFORM_FEE_PCT}%)</span>
                    <Money value={-comision} size="sm" showSign className="text-destructive" />
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Recibirías hoy</span>
                    <span className="text-2xl font-bold tracking-tight text-primary">
                      <Money value={recibirias} size="lg" className="text-primary" />
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <Separator className="shrink-0" />
        <div className="px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitted}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={selected.size === 0 || submitted}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            <Zap className="size-3.5" />
            {submitted ? 'Enviando…' : 'Solicitar pago anticipado'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
