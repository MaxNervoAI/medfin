'use client'

import { useState } from 'react'
import { formatFechaCorta, calcularFechaLimitePago } from '@/lib/utils'
import type { Prestacion, Alerta, Institucion } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Money } from '@/components/ui/Money'
import { Receipt, CheckCircle2, Clock, X, Phone, Mail } from 'lucide-react'

interface Props {
  alerta: Alerta
  prestacion: Prestacion
  institucion?: Institucion
  onClose: () => void
  onEmitirBoleta: (prestacion: Prestacion, fecha: string) => Promise<void>
  onMarcarPagada: (prestacion: Prestacion, fecha: string) => Promise<void>
  onSnooze: (prestacion: Prestacion, days: number) => Promise<void>
}

export default function AlertActionModal({
  alerta,
  prestacion: p,
  institucion,
  onClose,
  onEmitirBoleta,
  onMarcarPagada,
  onSnooze,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [fechaAccion, setFechaAccion] = useState(new Date().toISOString().split('T')[0])

  const isBoletaAlert = alerta.tipo.startsWith('boleta')
  const isPagoAlert = alerta.tipo.startsWith('pago')
  const isBoletaVencida = alerta.tipo === 'boleta_vencida'

  // Calculate missing values if they're NaN
  const retencionPct = p.retencion_pct || 0
  const montoRetencion = isNaN(p.monto_retencion) ? Math.round(p.monto_bruto * retencionPct / 100) : p.monto_retencion
  const montoNeto = isNaN(p.monto_neto) ? Math.round(p.monto_bruto * (1 - retencionPct / 100)) : p.monto_neto

  async function handleEmitirBoleta() {
    setLoading(true)
    try {
      await onEmitirBoleta(p, fechaAccion)
      onClose()
    } catch (error) {
      console.error('Error al emitir boleta:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarcarPagada() {
    setLoading(true)
    try {
      await onMarcarPagada(p, fechaAccion)
      onClose()
    } catch (error) {
      console.error('Error al marcar pagada:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSnooze(days: number) {
    setLoading(true)
    try {
      await onSnooze(p, days)
      onClose()
    } catch (error) {
      console.error('Error al posponer alerta:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm w-full p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl tracking-tight">{p.institucion_nombre}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {p.tipo_prestacion} · {formatFechaCorta(p.fecha_prestacion)}
          </p>
        </DialogHeader>

        <Separator />

        {/* Details */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Montos */}
          <div className="bg-muted/40 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monto bruto</span>
              <Money value={p.monto_bruto} size="lg" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Retención {retencionPct.toFixed(1)}%</span>
              <Money value={-montoRetencion} size="sm" showSign />
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Neto a recibir</span>
              <Money value={montoNeto} size="lg" className="text-success" />
            </div>
          </div>

          {/* Fecha límite */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="fecha-accion">Fecha de la acción</Label>
            <input
              id="fecha-accion"
              type="date"
              value={fechaAccion}
              onChange={e => setFechaAccion(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Alert info */}
          <div className="text-sm">
            <span className="text-muted-foreground">Límite: </span>
            <span className="font-medium">{formatFechaCorta(alerta.fecha_limite)}</span>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="px-6 py-4 flex flex-col gap-3">
          {isBoletaAlert && !isBoletaVencida && (
            <Button
              onClick={handleEmitirBoleta}
              disabled={loading}
              className="w-full gap-2"
            >
              <Receipt className="size-4" />
              {loading ? 'Procesando…' : 'Emitir boleta'}
            </Button>
          )}

          {isPagoAlert && (
            <Button
              onClick={handleMarcarPagada}
              disabled={loading}
              className="w-full gap-2"
            >
              <CheckCircle2 className="size-4" />
              {loading ? 'Procesando…' : 'Marcar pagada'}
            </Button>
          )}

          {/* Contact options for vencida alerts */}
          {isBoletaVencida && institucion && (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (institucion.email) window.location.href = `mailto:${institucion.email}`
                }}
                disabled={loading || !institucion.email}
                className="w-full gap-2"
              >
                <Mail className="size-4" />
                {institucion.email ? 'Contactar por email' : 'Sin email'}
              </Button>
              {institucion.phone && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `tel:${institucion.phone}`}
                  disabled={loading}
                  className="w-full gap-2"
                >
                  <Phone className="size-4" />
                  Llamar
                </Button>
              )}
            </div>
          )}

          {/* Snooze options - more prominent for vencida */}
          <div className={`flex flex-col gap-2 ${isBoletaVencida ? 'bg-muted/30 p-3 rounded-lg' : ''}`}>
            <p className="text-xs text-muted-foreground text-center">Posponer alerta</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 7].map(days => (
                <Button
                  key={days}
                  variant={isBoletaVencida ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSnooze(days)}
                  disabled={loading}
                  className="gap-1.5"
                >
                  <Clock className="size-3" />
                  {days}d
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
