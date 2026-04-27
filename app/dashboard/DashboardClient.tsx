'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { generarAlertas, getMesActual, calcularFechaLimitePago, getTaxRate, cn } from '@/lib/utils'
import type { Prestacion, Alerta, Institucion, ReglasPlazo, EstadoPrestacion } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, AlertTriangle, Clock, CheckCircle2, Plus, ArrowLeft, ArrowRight as ArrowRightIcon, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '@/components/ui/StatCard'
import { Money } from '@/components/ui/Money'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import AlertActionModal from '@/components/ui/AlertActionModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface Props {
  nombre: string
  prestaciones: Prestacion[]
  instituciones: Pick<Institucion, 'id' | 'nombre'>[]
  reglas: ReglasPlazo[]
}

type Step = 'institucion' | 'tipo' | 'monto' | 'confirmar'
const STEPS: Step[] = ['institucion', 'tipo', 'monto', 'confirmar']
const STEP_LABELS: Record<Step, string> = {
  institucion: 'Lugar',
  tipo: 'Prestación',
  monto: 'Monto',
  confirmar: 'Confirmar',
}

function estadoBadge(estado: string) {
  if (estado === 'pagada')        return <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">Pagada</Badge>
  if (estado === 'boleta_emitida') return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Boleta emitida</Badge>
  return <Badge variant="outline" className="text-warning border-warning/40">Sin boleta</Badge>
}

function AlertaRow({ alerta, onClick }: { alerta: Alerta; onClick: () => void }) {
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
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 w-full text-left hover:bg-muted/40 rounded-lg transition-colors cursor-pointer"
    >
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
    </button>
  )
}

function MiniBarChart({ prestaciones }: { prestaciones: Prestacion[] }) {
  console.log('MiniBarChart prestaciones:', prestaciones.length, prestaciones)
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
    const montoNeto = isNaN(p.monto_neto) ? Math.round(p.monto_bruto * (1 - (p.retencion_pct || 0) / 100)) : p.monto_neto
    if (p.estado === 'pagada') m.cobrado += montoNeto
    else m.proyectado += montoNeto
  })
  console.log('MiniBarChart months data:', months)
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
              <span className="text-[9px] text-muted-foreground tabular-nums">
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

export default function DashboardClient({ nombre, prestaciones, instituciones, reglas }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const mesActual = getMesActual()
  const [selectedAlert, setSelectedAlert] = useState<Alerta | null>(null)
  const [editingPrestacion, setEditingPrestacion] = useState<Prestacion | null>(null)
  const [localPrestaciones, setLocalPrestaciones] = useState(prestaciones)
  const [showNueva, setShowNueva] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const alertas = generarAlertas(localPrestaciones)

  // Nueva prestacion form state
  const [step, setStep] = useState<Step>('institucion')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [taxRate, setTaxRate] = useState(0.145)
  const [institucionId, setInstitucionId] = useState('')
  const [tipoPrestacion, setTipoPrestacion] = useState('')
  const [esTurno, setEsTurno] = useState(false)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [montoBruto, setMontoBruto] = useState('')
  const [horas, setHoras] = useState('')
  const [valorHora, setValorHora] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState<'boleta' | 'factura'>('boleta')
  const [notas, setNotas] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    getTaxRate(supabase).then(r => {
      const normalizedRate = r > 1 ? r / 100 : r
      setTaxRate(normalizedRate)
    })
  }, [supabase])

  useEffect(() => {
    setEsTurno(tipoPrestacion.toLowerCase().includes('turno'))
  }, [tipoPrestacion])

  const tiposDisponibles = reglas
    .filter(r => r.institucion_id === institucionId)
    .map(r => r.tipo_prestacion_nombre)

  const reglaAplicable = reglas.find(
    r => r.institucion_id === institucionId && r.tipo_prestacion_nombre === tipoPrestacion
  ) ?? null

  const montoBrutoCalculado = esTurno && horas && valorHora
    ? parseFloat(horas) * parseFloat(valorHora)
    : parseFloat(montoBruto) || 0

  const retencionPct = tipoDocumento === 'boleta' ? taxRate * 100 : 0
  const montoRetencion = Math.round(montoBrutoCalculado * retencionPct / 100)
  const montoNeto = Math.round(montoBrutoCalculado * (1 - retencionPct / 100))

  const fechaLimiteBoleta = reglaAplicable && fecha
    ? new Date(new Date(fecha).getTime() + reglaAplicable.dias_emitir_boleta * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null

  function resetForm() {
    setStep('institucion')
    setInstitucionId('')
    setTipoPrestacion('')
    setEsTurno(false)
    setFecha(new Date().toISOString().split('T')[0])
    setMontoBruto('')
    setHoras('')
    setValorHora('')
    setTipoDocumento('boleta')
    setNotas('')
    setSelectedFile(null)
    setError('')
  }

  function canAdvance(): boolean {
    if (step === 'institucion') return !!institucionId
    if (step === 'tipo') return !!tipoPrestacion.trim()
    if (step === 'monto') return montoBrutoCalculado > 0
    return true
  }

  function next() {
    setError('')
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function back() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  async function submitForm() {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado'); setLoading(false); return }

    const institucion = instituciones.find(i => i.id === institucionId)
    const { data, error: dbError } = await supabase.from('prestaciones').insert({
      user_id: user.id,
      institucion_id: institucionId,
      institucion_nombre: institucion?.nombre ?? '',
      tipo_prestacion: tipoPrestacion.trim(),
      es_turno: esTurno,
      fecha_prestacion: fecha,
      monto_bruto: montoBrutoCalculado,
      retencion_pct: retencionPct,
      monto_retencion: montoRetencion,
      monto_neto: montoNeto,
      horas: esTurno ? parseFloat(horas) : null,
      valor_hora: esTurno ? parseFloat(valorHora) : null,
      tipo_documento: tipoDocumento,
      notas: notas.trim() || null,
      estado: 'realizada',
      fecha_limite_boleta: fechaLimiteBoleta,
    }).select().single()

    setLoading(false)
    if (dbError) { setError(dbError.message || 'No se pudo guardar'); return }
    
    // Handle file upload if selected (for now, just log it)
    if (selectedFile) {
      console.log('File selected for upload:', selectedFile.name, selectedFile.size, selectedFile.type)
      // TODO: Implement actual file upload to storage
    }
    
    setLocalPrestaciones(prev => [data as Prestacion, ...prev])
    toast.success('Prestación registrada')
    setShowNueva(false)
    resetForm()
    router.refresh()
  }

  // Helper to calculate monto_neto with fallback for NaN values
  const getMontoNeto = (p: Prestacion) => {
    if (isNaN(p.monto_neto)) {
      const retencionPct = p.retencion_pct || 0
      return Math.round(p.monto_bruto * (1 - retencionPct / 100))
    }
    return p.monto_neto
  }

  const porCobrar = localPrestaciones.filter(p => p.estado !== 'pagada').reduce((a, p) => a + getMontoNeto(p), 0)
  const cobradoMes = localPrestaciones
    .filter(p => p.estado === 'pagada' && p.fecha_pago_recibido?.startsWith(mesActual))
    .reduce((a, p) => a + getMontoNeto(p), 0)
  const sinBoleta = localPrestaciones.filter(p => p.estado === 'realizada').length
  const boletaEmitida = localPrestaciones.filter(p => p.estado === 'boleta_emitida').length

  const primerNombre = nombre.split(' ')[0]

  const institucionNombre = instituciones.find(i => i.id === institucionId)?.nombre ?? ''
  const stepIdx = STEPS.indexOf(step)

  // Action handlers
  async function handleEmitirBoleta(prestacion: Prestacion, fecha: string) {
    const fechaLimitePago = calcularFechaLimitePago(fecha, 30)
    const { error } = await supabase
      .from('prestaciones')
      .update({
        estado: 'boleta_emitida',
        fecha_boleta_emitida: fecha,
        fecha_limite_pago: fechaLimitePago,
        alerta_snoozed_until: null,
      })
      .eq('id', prestacion.id)

    if (error) {
      toast.error('Error al emitir boleta')
      throw error
    }

    setLocalPrestaciones(prev =>
      prev.map(p =>
        p.id === prestacion.id
          ? { ...p, estado: 'boleta_emitida', fecha_boleta_emitida: fecha, fecha_limite_pago: fechaLimitePago, alerta_snoozed_until: null }
          : p
      )
    )
    toast.success('Boleta emitida')
    router.refresh()
  }

  async function handleMarcarPagada(prestacion: Prestacion, fecha: string) {
    const { error } = await supabase
      .from('prestaciones')
      .update({
        estado: 'pagada',
        fecha_pago_recibido: fecha,
        alerta_snoozed_until: null,
      })
      .eq('id', prestacion.id)

    if (error) {
      toast.error('Error al marcar pagada')
      throw error
    }

    setLocalPrestaciones(prev =>
      prev.map(p =>
        p.id === prestacion.id
          ? { ...p, estado: 'pagada', fecha_pago_recibido: fecha, alerta_snoozed_until: null }
          : p
      )
    )
    toast.success('Marcado como pagada')
    router.refresh()
  }

  async function handleSnooze(prestacion: Prestacion, days: number) {
    const snoozeUntil = new Date()
    snoozeUntil.setDate(snoozeUntil.getDate() + days)

    const { error } = await supabase
      .from('prestaciones')
      .update({ alerta_snoozed_until: snoozeUntil.toISOString() })
      .eq('id', prestacion.id)

    if (error) {
      toast.error('Error al posponer alerta')
      throw error
    }

    setLocalPrestaciones(prev =>
      prev.map(p =>
        p.id === prestacion.id ? { ...p, alerta_snoozed_until: snoozeUntil.toISOString() } : p
      )
    )
    toast.success(`Alerta pospuesta por ${days} días`)
    router.refresh()
  }

  function handleAlertClick(alerta: Alerta) {
    setSelectedAlert(alerta)
  }

  const selectedPrestacion = selectedAlert
    ? localPrestaciones.find(p => p.id === selectedAlert.prestacion_id) || null
    : null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Hola, ${primerNombre}`}
        subtitle={alertas.length > 0 ? `${alertas.length} ${alertas.length === 1 ? 'alerta pendiente' : 'alertas pendientes'} este mes` : 'Todo al día · sin alertas pendientes'}
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
          value={<span className="text-[2.6rem] leading-none tracking-tight text-warning">{sinBoleta}</span>}
          sub="pendientes de emitir"
          accent="warning"
        />
        <StatCard
          eyebrow="Boleta emitida"
          value={<span className="text-[2.6rem] leading-none tracking-tight text-primary">{boletaEmitida}</span>}
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
                  <AlertaRow key={a.id} alerta={a} onClick={() => handleAlertClick(a)} />
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
            <MiniBarChart prestaciones={localPrestaciones} />
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
              {[...localPrestaciones]
                .sort((a, b) => b.fecha_prestacion.localeCompare(a.fecha_prestacion))
                .slice(0, 5)
                .map(p => (
                  <tr 
                    key={p.id} 
                    className={cn(
                      "hover:bg-muted/40 transition-colors",
                      p.estado === 'realizada' && "cursor-pointer hover:bg-primary/5"
                    )}
                    onClick={() => p.estado === 'realizada' && (setEditingPrestacion(p), setShowEdit(true))}
                  >
                    <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
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
          {localPrestaciones.length === 0 && (
            <EmptyState title="Sin prestaciones" description="Agrega tu primera prestación para ver los movimientos" className="py-8" />
          )}
        </div>
      </Card>

      {/* Alert Action Modal */}
      {selectedAlert && selectedPrestacion && (
        <AlertActionModal
          alerta={selectedAlert}
          prestacion={selectedPrestacion}
          institucion={instituciones.find(i => i.id === selectedPrestacion.institucion_id)}
          onClose={() => setSelectedAlert(null)}
          onEmitirBoleta={handleEmitirBoleta}
          onMarcarPagada={handleMarcarPagada}
          onSnooze={handleSnooze}
        />
      )}

      {/* Edit prestación modal */}
      {editingPrestacion && (
        <Dialog open={showEdit} onOpenChange={open => !open && (setShowEdit(false), setEditingPrestacion(null))}>
          <DialogContent className="max-w-sm w-full p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-xl tracking-tight">Editar prestación</DialogTitle>
            </DialogHeader>

            <Separator />

            <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-muted/30 rounded-lg p-4 flex flex-col gap-2.5 text-sm">
                <Row label="Institución" value={editingPrestacion.institucion_nombre} />
                <Row label="Prestación" value={editingPrestacion.tipo_prestacion} />
                <Row label="Fecha" value={editingPrestacion.fecha_prestacion.split('-').reverse().join('/')} />
                <Separator />
                <Row label="Monto bruto" value={<Money value={editingPrestacion.monto_bruto} size="sm" />} />
                <Row label="Neto a recibir" value={<Money value={editingPrestacion.monto_neto} size="sm" className="text-success" />} bold />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-archivo">Adjuntar archivo <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <div className="relative">
                  <input
                    id="edit-archivo"
                    type="file"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('edit-archivo')?.click()}
                    className="w-full"
                  >
                    {selectedFile ? selectedFile.name : 'Seleccionar archivo...'}
                  </Button>
                </div>
                {editingPrestacion.files && editingPrestacion.files.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Archivos existentes: {editingPrestacion.files.length}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="px-6 py-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => (setShowEdit(false), setEditingPrestacion(null))}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (selectedFile) {
                    console.log('File upload for edit:', selectedFile.name)
                    // TODO: Implement actual file upload
                  }
                  toast.success('Prestación actualizada')
                  setShowEdit(false)
                  setEditingPrestacion(null)
                  setSelectedFile(null)
                }}
                className="flex-1"
              >
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Nueva prestación modal */}
      <Dialog open={showNueva} onOpenChange={open => !open && setShowNueva(false)}>
        <DialogContent className="max-w-sm w-full p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl tracking-tight">Nueva prestación</DialogTitle>
            {/* Step pills */}
            <div className="flex gap-1.5 mt-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i < stepIdx ? 'bg-primary w-6' :
                    i === stepIdx ? 'bg-primary w-10' : 'bg-muted w-6'
                  )} />
                  {i === stepIdx && (
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      {STEP_LABELS[s]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>

          <Separator />

          <div className="px-6 py-5 min-h-[220px] max-h-[60vh] overflow-y-auto">
            {/* Step 1: Institución */}
            {step === 'institucion' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">¿Dónde fue la prestación?</p>
                  <p className="text-sm text-muted-foreground">Selecciona la institución</p>
                </div>
                {instituciones.length === 0 ? (
                  <Alert className="border-warning/30 bg-warning/5">
                    <Info className="size-4 text-warning" />
                    <AlertDescription className="text-sm">
                      Primero agrega una institución en <span className="font-semibold">Lugares</span>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex flex-col gap-2">
                    {instituciones.map(i => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setInstitucionId(i.id)}
                        className={cn(
                          'text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium',
                          institucionId === i.id
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-card border-border hover:border-primary/40 text-foreground'
                        )}
                      >
                        {i.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Tipo de prestación */}
            {step === 'tipo' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">¿Qué tipo de prestación?</p>
                  <p className="text-sm text-muted-foreground">{institucionNombre}</p>
                </div>
                {tiposDisponibles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tiposDisponibles.map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setTipoPrestacion(tipo)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                          tipoPrestacion === tipo
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:border-primary/40 text-foreground'
                        )}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tipo-prestacion">
                    {tiposDisponibles.length > 0 ? 'O escribe uno nuevo' : 'Tipo de prestación'}
                  </Label>
                  <Input
                    id="tipo-prestacion"
                    placeholder="Cirugía, Endoscopia, Turno..."
                    value={tipoPrestacion}
                    onChange={e => setTipoPrestacion(e.target.value)}
                    autoFocus
                  />
                </div>
                {reglaAplicable && (
                  <Alert className="border-primary/30 bg-primary/5 py-2">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    <AlertDescription className="text-xs text-foreground">
                      Boleta en {reglaAplicable.dias_emitir_boleta}d · Pago en {reglaAplicable.dias_recibir_pago}d
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 3: Fecha y monto */}
            {step === 'monto' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">Fecha y monto</p>
                  <p className="text-sm text-muted-foreground">{tipoPrestacion}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fecha">Fecha de la prestación</Label>
                  <Input id="fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEsTurno(!esTurno)}
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors shrink-0',
                      esTurno ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                    role="switch" aria-checked={esTurno}
                  >
                    <span className={cn(
                      'absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow transition-transform',
                      esTurno && 'translate-x-5'
                    )} />
                  </button>
                  <span className="text-sm">Es turno (pago por horas)</span>
                </div>
                {esTurno ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="horas">Horas</Label>
                      <Input id="horas" type="number" min="0" step="0.5" placeholder="8" inputMode="numeric" value={horas} onChange={e => setHoras(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="valor-hora">Valor/hora</Label>
                      <Input id="valor-hora" type="number" min="0" placeholder="50000" inputMode="numeric" value={valorHora} onChange={e => setValorHora(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="monto">Monto bruto ($)</Label>
                    <Input id="monto" type="number" min="0" placeholder="500000" inputMode="numeric" value={montoBruto} onChange={e => setMontoBruto(e.target.value)} />
                  </div>
                )}
                {montoBrutoCalculado > 0 && (
                  <div className="bg-muted/40 rounded-lg p-3 flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bruto</span>
                      <Money value={montoBrutoCalculado} size="sm" />
                    </div>
                    {retencionPct > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Retención {retencionPct.toFixed(1)}%</span>
                        <Money value={-montoRetencion} size="sm" showSign />
                      </div>
                    )}
                    <Separator className="my-0.5" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Neto</span>
                      <Money value={montoNeto} size="sm" className="text-success" />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {(['boleta', 'factura'] as const).map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoDocumento(tipo)}
                      className={cn(
                        'flex-1 py-2 rounded-md text-xs font-medium border transition-colors capitalize',
                        tipoDocumento === tipo
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/40 text-foreground'
                      )}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Confirmar */}
            {step === 'confirmar' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">¿Todo correcto?</p>
                  <p className="text-sm text-muted-foreground">Revisa antes de guardar</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 flex flex-col gap-2.5 text-sm">
                  <Row label="Institución" value={institucionNombre} />
                  <Row label="Prestación" value={tipoPrestacion} />
                  <Row label="Fecha" value={fecha.split('-').reverse().join('/')} />
                  <Separator />
                  <Row label="Monto bruto" value={<Money value={montoBrutoCalculado} size="sm" />} />
                  <Row label="Neto a recibir" value={<Money value={montoNeto} size="sm" className="text-success" />} bold />
                  <Row label="Documento" value={tipoDocumento} />
                  {fechaLimiteBoleta && (
                    <Row label="Límite boleta" value={fechaLimiteBoleta.split('-').reverse().join('/')} />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notas">Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <Textarea
                    id="notas"
                    rows={2}
                    placeholder="Observaciones..."
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    className="resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="archivo">Adjuntar archivo <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <div className="relative">
                    <input
                      id="archivo"
                      type="file"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      className="sr-only"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('archivo')?.click()}
                      className="w-full"
                    >
                      {selectedFile ? selectedFile.name : 'Seleccionar archivo...'}
                    </Button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Footer nav */}
          <div className="px-6 py-4 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={stepIdx === 0 ? () => setShowNueva(false) : back}
              disabled={loading}
            >
              {stepIdx === 0 ? 'Cancelar' : <><ArrowLeft className="size-3.5" />Atrás</>}
            </Button>

            {step !== 'confirmar' ? (
              <Button
                size="sm"
                onClick={next}
                disabled={!canAdvance()}
              >
                Siguiente<ArrowRightIcon className="size-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={loading}
                onClick={submitForm}
              >
                {loading ? 'Guardando…' : 'Guardar'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between items-center gap-2', bold && 'font-semibold')}>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  )
}
