'use client'

import { useState } from 'react'
import type React from 'react'
import { formatFechaCorta } from '@/lib/utils'
import type { Prestacion } from '@/types'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/Money'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, Trash2, Edit, Receipt } from 'lucide-react'
import Link from 'next/link'

interface Props {
  prestacion: Prestacion
  onClose: () => void
  onBoletaEmitida: (p: Prestacion, fecha: string) => Promise<void>
  onPagada: (p: Prestacion, fecha: string) => Promise<void>
  onEliminar: (id: string) => Promise<void>
}

export default function PrestacionDetalle({ prestacion: p, onBoletaEmitida, onPagada, onEliminar }: Props) {
  const [loading, setLoading] = useState(false)
  const [fechaAccion, setFechaAccion] = useState(new Date().toISOString().split('T')[0])
  const [files, setFiles] = useState(p.files || [])
  const isJsonDbMode = process.env.NEXT_PUBLIC_USE_JSON_DB === 'true'

  // Calculate missing values if they're NaN (for records created before the fix)
  const retencionPct = p.retencion_pct || 0
  const montoRetencion = isNaN(p.monto_retencion) ? Math.round(p.monto_bruto * retencionPct / 100) : p.monto_retencion
  const montoNeto = isNaN(p.monto_neto) ? Math.round(p.monto_bruto * (1 - retencionPct / 100)) : p.monto_neto

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

  function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
    return (
      <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-medium ${accent ?? 'text-foreground'}`}>{value}</span>
      </div>
    )
  }

  return (
    <div className="p-6 pb-safe">
      {/* Handle bar */}
      <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />

      <SheetHeader className="text-left mb-5">
        <SheetTitle className="text-lg font-semibold">{p.institucion_nombre}</SheetTitle>
        <p className="text-sm text-muted-foreground">
          {p.tipo_prestacion} · {formatFechaCorta(p.fecha_prestacion)}
        </p>
      </SheetHeader>

      {/* Montos */}
      <div className="bg-muted/40 rounded-xl p-4 mb-5 flex flex-col gap-2">
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

      {/* Info rows */}
      <div className="mb-5">
        {p.es_turno && p.horas && p.valor_hora && (
          <InfoRow label="Turno" value={`${p.horas}h × $${p.valor_hora.toLocaleString('es-CL')}/h`} />
        )}
        <InfoRow label="Tipo documento" value={<span className="capitalize">{p.tipo_documento}</span>} />
        {p.fecha_limite_boleta && (
          <InfoRow label="Límite boleta" value={formatFechaCorta(p.fecha_limite_boleta)} />
        )}
        {p.fecha_boleta_emitida && (
          <InfoRow label="Boleta emitida" value={formatFechaCorta(p.fecha_boleta_emitida)} />
        )}
        {p.fecha_limite_pago && (
          <InfoRow label="Límite pago" value={formatFechaCorta(p.fecha_limite_pago)} />
        )}
        {p.fecha_pago_recibido && (
          <InfoRow label="Pago recibido" value={formatFechaCorta(p.fecha_pago_recibido)} accent="text-success" />
        )}
        {p.notas && (
          <InfoRow label="Notas" value={p.notas} />
        )}
      </div>

      {/* Archivos adjuntos */}
      {files.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-muted-foreground mb-2">Archivos adjuntos</p>
          <div className="flex flex-col gap-2">
            {files.map(file => (
              isJsonDbMode ? (
                <div
                  key={file.id}
                  className="flex items-center gap-2 text-sm text-foreground p-2 rounded-lg bg-muted/40"
                >
                  <span className="flex-1 truncate">{file.filename}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.file_size / 1024).toFixed(1)} KB
                  </span>
                  <span className="text-xs text-warning">(demo - no disponible)</span>
                </div>
              ) : (
                <a
                  key={file.id}
                  href={`/api/prestaciones/${p.id}/files/${file.id}/download`}
                  download={file.filename}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-2 rounded-lg bg-muted/40 hover:bg-muted/60"
                >
                  <span className="flex-1 truncate">{file.filename}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.file_size / 1024).toFixed(1)} KB
                  </span>
                </a>
              )
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {p.estado !== 'pagada' && (
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="fecha-accion">
              Fecha de la acción
            </label>
            <input
              id="fecha-accion"
              type="date"
              value={fechaAccion}
              onChange={e => setFechaAccion(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {p.estado === 'realizada' && (
            <Button onClick={handleBoletaEmitida} disabled={loading} className="w-full gap-2">
              <Receipt className="size-4" />
              {loading ? 'Guardando…' : 'Marcar boleta como emitida'}
            </Button>
          )}

          {p.estado === 'boleta_emitida' && (
            <Button onClick={handlePagada} disabled={loading} className="w-full gap-2">
              <CheckCircle2 className="size-4" />
              {loading ? 'Guardando…' : 'Marcar como pagada'}
            </Button>
          )}
        </div>
      )}

      {/* Footer: edit + delete */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1 gap-1.5">
          <Link href={`/prestaciones/${p.id}/editar`}>
            <Edit className="size-3.5" /> Editar
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30">
              <Trash2 className="size-3.5" /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar prestación?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará permanentemente la prestación de {p.institucion_nombre}. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEliminar}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
