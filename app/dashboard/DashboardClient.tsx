'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { generarAlertas, getMesActual, getNombreMes, calcularFechaLimitePago, getTaxRate, cn } from '@/lib/utils'
import type { Prestacion, Alerta, Institucion, ReglasPlazo } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, AlertTriangle, Clock, CheckCircle2, Plus, ArrowLeft, ArrowRight as ArrowRightIcon, Zap, ChevronLeft, ChevronRight, TrendingUp, Bell } from 'lucide-react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import PagoAnticipadoModal from '@/components/ui/PagoAnticipadoModal'
import InstitucionCombobox from '@/components/ui/InstitucionCombobox'
import TipoPrestacionCombobox from '@/components/ui/TipoPrestacionCombobox'

interface Props {
  nombre: string
  prestaciones: Prestacion[]
  instituciones: Pick<Institucion, 'id' | 'nombre' | 'directorio_id'>[]
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

function MiniBarChart({ prestaciones, hideLegend }: { prestaciones: Prestacion[], hideLegend?: boolean }) {
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
  const max = Math.max(...months.map(m => m.cobrado + m.proyectado), 1)
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2.5 h-40">
        {months.map(m => {
          const total = m.cobrado + m.proyectado
          const cobH = (m.cobrado / max) * 140
          const proH = (m.proyectado / max) * 140
          const isCurrent = m.key === currentKey
          return (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground tabular-nums font-medium">
                {total > 0 ? `$${Math.round(total / 1000)}k` : ''}
              </span>
              <div className="w-full flex flex-col justify-end gap-px rounded-sm overflow-hidden" style={{ height: 140 }}>
                {proH > 0 && (
                  <div
                    className="w-full border border-dashed border-primary/40 bg-primary/10"
                    style={{ height: proH }}
                  />
                )}
                {cobH > 0 && (
                  <div
                    className={cn('w-full bg-primary', proH === 0 && 'rounded-t-sm', isCurrent && 'bg-primary')}
                    style={{ height: cobH }}
                  />
                )}
                {total === 0 && <div className="w-full h-0.5 bg-border/60 self-end" />}
              </div>
              <span className={cn('text-[11px] capitalize font-medium', isCurrent ? 'text-foreground' : 'text-muted-foreground')}>
                {m.label}
              </span>
            </div>
          )
        })}
      </div>
      {!hideLegend && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary inline-block" /> Cobrado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary/10 border border-dashed border-primary/40 inline-block" /> Esperado
          </span>
        </div>
      )}
    </div>
  )
}

export default function DashboardClient({ nombre, prestaciones, instituciones, reglas }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [expandedInst, setExpandedInst] = useState<string | null>(null)
  const mesActual = getMesActual()
  const meses = (() => {
    const set = new Set<string>()
    set.add(mesActual)
    prestaciones.forEach(p => set.add(p.fecha_prestacion.substring(0, 7)))
    return Array.from(set).sort().reverse()
  })()
  const [mesIdx, setMesIdx] = useState(0)
  const mesSeleccionado = meses[mesIdx] ?? mesActual
  const [selectedAlert, setSelectedAlert] = useState<Alerta | null>(null)
  const [editingPrestacion, setEditingPrestacion] = useState<Prestacion | null>(null)
  const [localPrestaciones, setLocalPrestaciones] = useState(prestaciones)
  const [showNueva, setShowNueva] = useState(false)
  const [showPagoAnticipado, setShowPagoAnticipado] = useState(false)
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
      horas: esTurno ? parseFloat(horas) : null,
      valor_hora: esTurno ? parseFloat(valorHora) : null,
      tipo_documento: tipoDocumento,
      notas: notas.trim() || null,
      estado: 'realizada',
      fecha_limite_boleta: fechaLimiteBoleta,
    }).select().single()

    setLoading(false)
    if (dbError) { setError(dbError.message || 'No se pudo guardar'); return }
    
    if (selectedFile && data?.id) {
      const uploadForm = new FormData()
      uploadForm.append('file', selectedFile)
      const uploadRes = await fetch(`/api/prestaciones/${data.id}/files/upload`, {
        method: 'POST',
        body: uploadForm,
      })
      if (!uploadRes.ok) {
        toast.error('Prestación guardada, pero no se pudo subir el archivo')
      }
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

  // Presupuesto / monthly breakdown
  const delMes = localPrestaciones.filter(p => p.fecha_prestacion.startsWith(mesSeleccionado))
  const pagadasDelMes = localPrestaciones.filter(p => p.fecha_pago_recibido?.startsWith(mesSeleccionado))
  const proyeccion = {
    totalBruto: delMes.reduce((s, p) => s + p.monto_bruto, 0),
    totalNeto: delMes.reduce((s, p) => s + getMontoNeto(p), 0),
    pagado: delMes.filter(p => p.estado === 'pagada').reduce((s, p) => s + getMontoNeto(p), 0),
    pendiente: delMes.filter(p => p.estado !== 'pagada').reduce((s, p) => s + getMontoNeto(p), 0),
  }
  const cobradoEnMes = pagadasDelMes.reduce((s, p) => s + getMontoNeto(p), 0)
  const porInstitucion = delMes.reduce<Record<string, { bruto: number; neto: number; pagado: number; pendiente: number; count: number }>>((acc, p) => {
    if (!acc[p.institucion_nombre]) acc[p.institucion_nombre] = { bruto: 0, neto: 0, pagado: 0, pendiente: 0, count: 0 }
    const neto = getMontoNeto(p)
    acc[p.institucion_nombre].bruto += p.monto_bruto
    acc[p.institucion_nombre].neto += neto
    acc[p.institucion_nombre].count++
    if (p.estado === 'pagada') acc[p.institucion_nombre].pagado += neto
    else acc[p.institucion_nombre].pendiente += neto
    return acc
  }, {})
  const instEntries = Object.entries(porInstitucion).sort((a, b) => b[1].bruto - a[1].bruto)
  const pctCobrado = proyeccion.totalNeto > 0 ? Math.min((proyeccion.pagado / proyeccion.totalNeto) * 100, 100) : 0
  const mesLabel = getNombreMes(mesSeleccionado).split(' ')[0]

  const primerNombre = nombre.split(' ')[0]
  const isZeroState = localPrestaciones.length === 0 && instituciones.length === 0

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
        subtitle={alertas.length > 0 ? `${alertas.length} ${alertas.length === 1 ? 'alerta pendiente' : 'alertas pendientes'}` : 'Todo al día · sin alertas pendientes'}
        actions={
          <div className="flex items-center gap-2">
            {/* Bell alerts */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 relative">
                  <Bell className="size-4" />
                  {alertas.length > 0 && (
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold">Alertas</p>
                  <Button variant="ghost" size="sm" asChild className="h-6 text-xs px-2">
                    <Link href="/prestaciones">Ver todas <ArrowRight className="size-3 ml-1" /></Link>
                  </Button>
                </div>
                {alertas.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                    <CheckCircle2 className="size-5 text-success" />
                    <p className="text-sm font-medium">Todo al día</p>
                    <p className="text-xs text-muted-foreground">Sin alertas pendientes</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border max-h-72 overflow-y-auto">
                    {alertas.slice(0, 8).map(a => (
                      <AlertaRow key={a.id} alerta={a} onClick={() => handleAlertClick(a)} />
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-border text-muted-foreground hover:bg-accent hidden sm:flex"
              onClick={() => setShowPagoAnticipado(true)}
            >
              <Zap className="size-3.5" />
              Pago anticipado
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setShowNueva(true)}
            >
              <Plus className="size-3.5" />
              Nueva prestación
            </Button>
          </div>
        }
      />

      {isZeroState ? (
        <WelcomeCard onRegister={() => setShowNueva(true)} />
      ) : (
        <>
          {/* Month navigator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8"
                onClick={() => setMesIdx(i => Math.min(i + 1, meses.length - 1))}
                disabled={mesIdx >= meses.length - 1} aria-label="Mes anterior">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground capitalize min-w-[110px] text-center">
                {mesLabel}
              </span>
              <Button variant="ghost" size="icon" className="size-8"
                onClick={() => setMesIdx(i => Math.max(i - 1, 0))}
                disabled={mesIdx <= 0} aria-label="Mes siguiente">
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">{delMes.length} prestaciones</span>
          </div>

          {delMes.length === 0 ? (
            <EmptyState icon={<TrendingUp />} title="Sin prestaciones este mes" description="Registra prestaciones para ver la proyección" />
          ) : (
            <>
              {/* Hero card — received + expected */}
              <Card className="bg-primary text-primary-foreground border-0 shadow-md overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wide mb-1">
                    Total neto · {mesLabel}
                  </p>
                  <Money value={proyeccion.totalNeto} size="xl" className="text-primary-foreground" />

                  {/* Dual columns */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-300 shrink-0" />
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Recibido</p>
                      </div>
                      <Money value={cobradoEnMes} size="md" className="text-white font-bold" />
                      <p className="text-[10px] text-white/40 mt-1">
                        {pagadasDelMes.length} {pagadasDelMes.length === 1 ? 'pago' : 'pagos'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="size-1.5 rounded-full bg-amber-300 shrink-0" />
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">Pendiente</p>
                      </div>
                      <Money value={proyeccion.pendiente} size="md" className="text-white/80 font-bold" />
                      <p className="text-[10px] text-white/40 mt-1">
                        {delMes.filter(p => p.estado !== 'pagada').length} prestaciones
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                      <div className="h-full bg-emerald-300 rounded-full transition-all duration-500" style={{ width: `${pctCobrado}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-white/40">
                      <span>0%</span>
                      <span>{Math.round(pctCobrado)}% cobrado</span>
                      <span>100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proyección de ingresos — 2nd position */}
              <Card className="border-border/60">
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">Proyección de ingresos</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Cobrado + esperado · neto · 6 meses</p>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-primary inline-block" /> Cobrado
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-primary/10 border border-dashed border-primary/40 inline-block" /> Esperado
                    </span>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-5 pb-4">
                  <MiniBarChart prestaciones={localPrestaciones} hideLegend />
                </CardContent>
              </Card>

              {/* Stat grid */}
              <StatCard
                eyebrow="Monto bruto"
                value={<Money value={proyeccion.totalBruto} size="lg" />}
                sub={`${sinBoleta} sin boleta · ${boletaEmitida} emitida`}
              />

              {/* By institution — expandable */}
              {instEntries.length > 0 && (
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Por institución</CardTitle>
                  </CardHeader>
                  <Separator />
                  <div className="divide-y divide-border/60">
                    {instEntries.map(([instNombre, datos]) => {
                      const pct = proyeccion.totalBruto > 0 ? (datos.bruto / proyeccion.totalBruto) * 100 : 0
                      const isOpen = expandedInst === instNombre
                      const prestsDeMes = delMes
                        .filter(p => p.institucion_nombre === instNombre)
                        .sort((a, b) => b.fecha_prestacion.localeCompare(a.fecha_prestacion))
                      const pagadoPct = datos.neto > 0 ? Math.min((datos.pagado / datos.neto) * 100, 100) : 0
                      return (
                        <div key={instNombre}>
                          <button
                            type="button"
                            onClick={() => setExpandedInst(isOpen ? null : instNombre)}
                            className="w-full flex flex-col gap-2 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <ChevronRight className={cn('size-3.5 text-muted-foreground transition-transform shrink-0', isOpen && 'rotate-90')} />
                                <span className="text-sm font-medium text-foreground">{instNombre}</span>
                                <span className="text-xs text-muted-foreground">{datos.count}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {datos.pagado > 0 && (
                                  <span className="text-xs text-success font-medium">
                                    <Money value={datos.pagado} size="sm" className="text-success" />
                                  </span>
                                )}
                                {datos.pendiente > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    <Money value={datos.pendiente} size="sm" />
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Dual progress: green=paid, muted=pending */}
                            <div className="pl-5 flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-muted/50">
                              {datos.pagado > 0 && (
                                <div className="bg-success rounded-l-full" style={{ width: `${pagadoPct}%` }} />
                              )}
                              {datos.pendiente > 0 && (
                                <div className="bg-warning/40 flex-1 rounded-r-full" />
                              )}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="border-t border-border/40 bg-muted/20">
                              {prestsDeMes.map(p => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between px-6 py-2.5 border-b border-border/30 last:border-0"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                                      {new Date(p.fecha_prestacion + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                    <span className="text-xs text-foreground truncate">{p.tipo_prestacion}</span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <Money value={getMontoNeto(p)} size="sm" className={p.estado === 'pagada' ? 'text-success' : 'text-foreground'} />
                                    {estadoBadge(p.estado)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}



      {/* Alert Action Modal */}
      {selectedAlert && selectedPrestacion && (
        <AlertActionModal
          alerta={selectedAlert}
          prestacion={selectedPrestacion}
          institucion={instituciones.find(i => i.id === selectedPrestacion.institucion_id) as any}
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
                  if (selectedFile && editingPrestacion?.id) {
                    const uploadForm = new FormData()
                    uploadForm.append('file', selectedFile)
                    const uploadRes = await fetch(`/api/prestaciones/${editingPrestacion.id}/files/upload`, {
                      method: 'POST',
                      body: uploadForm,
                    })
                    if (!uploadRes.ok) {
                      toast.error('No se pudo subir el archivo')
                      return
                    }
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
                  <p className="text-sm text-muted-foreground">Busca o agrega la clínica u hospital</p>
                </div>
                <InstitucionCombobox
                  value={institucionId || null}
                  onChange={inst => {
                    setInstitucionId(inst.id)
                    // Add to local list if new (so downstream steps can find it)
                    if (!instituciones.find(i => i.id === inst.id)) {
                      instituciones.push(inst)
                    }
                  }}
                  userInstituciones={instituciones.map(i => ({ id: i.id, nombre: i.nombre, directorio_id: i.directorio_id ?? null }))}
                />
                {/* Quick-select existing institutions */}
                {instituciones.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-muted-foreground">Tus instituciones:</p>
                    <div className="flex flex-col gap-1.5">
                      {instituciones.map(i => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => setInstitucionId(i.id)}
                          className={cn(
                            'text-left px-3 py-2 rounded-lg border transition-all text-sm font-medium',
                            institucionId === i.id
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-card border-border hover:border-primary/40 text-foreground'
                          )}
                        >
                          {i.nombre}
                        </button>
                      ))}
                    </div>
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

                <TipoPrestacionCombobox
                  value={tipoPrestacion}
                  onChange={(val, esTurnoVal) => {
                    setTipoPrestacion(val)
                    if (esTurnoVal !== undefined) setEsTurno(esTurnoVal)
                  }}
                  placeholder="Buscar: cirugía, consulta, turno…"
                />

                {tiposDisponibles.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Configurados para esta institución:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tiposDisponibles.map(tipo => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setTipoPrestacion(tipo)}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                            tipoPrestacion === tipo
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                          )}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {reglaAplicable && (
                  <Alert className="border-primary/30 bg-primary/5 py-2">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    <AlertDescription className="text-xs text-foreground">
                      Emitir boleta en {reglaAplicable.dias_emitir_boleta} días · Recibir pago en {reglaAplicable.dias_recibir_pago} días desde la boleta
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
                  {tipoDocumento === 'boleta' ? (
                    <Row label={`Retención ${retencionPct.toFixed(1)}%`} value={<Money value={-montoRetencion} size="sm" showSign className="text-destructive" />} />
                  ) : (
                    <Row label="Retención" value={<span className="text-xs text-muted-foreground">Sin retención (factura)</span>} />
                  )}
                  <Separator className="my-0" />
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

      {/* Pago Anticipado Modal */}
      <PagoAnticipadoModal
        open={showPagoAnticipado}
        onClose={() => setShowPagoAnticipado(false)}
        prestaciones={localPrestaciones}
      />
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

function WelcomeCard({ onRegister }: { onRegister: () => void }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-10 flex flex-col items-center text-center gap-5">
        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Plus className="size-7 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Bienvenido a Dr Wallet</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Registra tu primera prestación para empezar a trackear tus honorarios, la retención del 14,5% y tus plazos de cobro.
          </p>
        </div>
        <Button size="lg" onClick={onRegister} className="gap-2">
          <Plus className="size-4" />
          Registrar primera prestación
        </Button>
        <p className="text-xs text-muted-foreground">
          Puedes buscar tu clínica directamente — no necesitas configurar nada antes.
        </p>
      </CardContent>
    </Card>
  )
}
