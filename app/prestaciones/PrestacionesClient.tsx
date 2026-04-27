'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, ArrowLeft, ArrowRight, CheckCircle2, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatFechaCorta, diasHasta, calcularFechaLimiteBoleta, getTaxRate } from '@/lib/utils'
import type { Prestacion, EstadoPrestacion, Institucion, ReglasPlazo } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Money } from '@/components/ui/Money'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import PrestacionDetalle from './PrestacionDetalle'
import { toast } from 'sonner'

function getEstadoBadge(prestacion: Prestacion) {
  if (prestacion.estado === 'pagada')
    return <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10 shrink-0">Pagada</Badge>
  if (prestacion.estado === 'boleta_emitida') {
    if (prestacion.fecha_limite_pago) {
      const dias = diasHasta(prestacion.fecha_limite_pago)
      if (dias < 0) return <Badge variant="destructive" className="shrink-0">Pago vencido</Badge>
      if (dias <= 3) return <Badge variant="outline" className="text-warning border-warning/40 shrink-0">Vence pronto</Badge>
    }
    return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shrink-0">Boleta emitida</Badge>
  }
  if (prestacion.fecha_limite_boleta) {
    const dias = diasHasta(prestacion.fecha_limite_boleta)
    if (dias < 0) return <Badge variant="destructive" className="shrink-0">Boleta vencida</Badge>
    if (dias <= 3) return <Badge variant="outline" className="text-warning border-warning/40 shrink-0">Emitir pronto</Badge>
  }
  return <Badge variant="outline" className="shrink-0">Sin boleta</Badge>
}

interface Props {
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

function useNuevaForm(instituciones: Props['instituciones'], reglas: Props['reglas'], supabase: ReturnType<typeof createClient>) {
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

  useEffect(() => {
    getTaxRate(supabase).then(r => {
      const normalizedRate = r > 1 ? r / 100 : r
      setTaxRate(normalizedRate)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    ? calcularFechaLimiteBoleta(fecha, reglaAplicable.dias_emitir_boleta)
    : null

  function reset() {
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

  async function submit(onSuccess: (p: Prestacion) => void) {
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
    onSuccess(data as Prestacion)
  }

  const institucionNombre = instituciones.find(i => i.id === institucionId)?.nombre ?? ''

  return {
    step, next, back, canAdvance, reset, submit, loading, error,
    institucionId, setInstitucionId,
    tipoPrestacion, setTipoPrestacion,
    tiposDisponibles, reglaAplicable,
    esTurno, setEsTurno,
    fecha, setFecha,
    montoBruto, setMontoBruto,
    horas, setHoras,
    valorHora, setValorHora,
    tipoDocumento, setTipoDocumento,
    notas, setNotas,
    montoBrutoCalculado, retencionPct, montoRetencion, montoNeto,
    fechaLimiteBoleta, institucionNombre,
  }
}

export default function PrestacionesClient({ prestaciones: init, instituciones, reglas }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [prestaciones, setPrestaciones] = useState(init)
  const [filtro, setFiltro] = useState<EstadoPrestacion | 'todas'>('todas')
  const [selected, setSelected] = useState<Prestacion | null>(null)
  const [showNueva, setShowNueva] = useState(false)

  const form = useNuevaForm(instituciones, reglas, supabase)

  const filtradas = prestaciones
    .filter(p => filtro === 'todas' || p.estado === filtro)
    .sort((a, b) => b.fecha_prestacion.localeCompare(a.fecha_prestacion))

  function openNueva() { form.reset(); setShowNueva(true) }
  function closeNueva() { setShowNueva(false) }

  async function marcarBoletaEmitida(prestacion: Prestacion, fecha: string) {
    const fechaLimitePago = calcularFechaLimitePago(fecha)
    const { error } = await supabase
      .from('prestaciones')
      .update({ estado: 'boleta_emitida', fecha_boleta_emitida: fecha, fecha_limite_pago: fechaLimitePago })
      .eq('id', prestacion.id)
    if (error) { toast.error('Error al actualizar'); return }
    setPrestaciones(prev => prev.map(p => p.id === prestacion.id
      ? { ...p, estado: 'boleta_emitida', fecha_boleta_emitida: fecha, fecha_limite_pago: fechaLimitePago }
      : p
    ))
    setSelected(null)
    toast.success('Boleta marcada como emitida')
    router.refresh()
  }

  async function marcarPagada(prestacion: Prestacion, fecha: string) {
    const { error } = await supabase
      .from('prestaciones')
      .update({ estado: 'pagada', fecha_pago_recibido: fecha })
      .eq('id', prestacion.id)
    if (error) { toast.error('Error al actualizar'); return }
    setPrestaciones(prev => prev.map(p => p.id === prestacion.id
      ? { ...p, estado: 'pagada', fecha_pago_recibido: fecha }
      : p
    ))
    setSelected(null)
    toast.success('Prestación marcada como pagada')
    router.refresh()
  }

  async function eliminarPrestacion(id: string) {
    const { error } = await supabase.from('prestaciones').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar'); return }
    setPrestaciones(prev => prev.filter(p => p.id !== id))
    setSelected(null)
    toast.success('Prestación eliminada')
  }

  async function editarPrestacion(prestacion: Prestacion, data: Partial<Prestacion>) {
    const { error } = await supabase.from('prestaciones').update(data).eq('id', prestacion.id)
    if (error) { toast.error('Error al editar'); throw error }
    setPrestaciones(prev => prev.map(p => p.id === prestacion.id ? { ...p, ...data } : p))
    toast.success('Prestación actualizada')
    router.refresh()
  }

  const stepIdx = STEPS.indexOf(form.step)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Prestaciones"
        subtitle={`${prestaciones.length} prestaciones registradas`}
        actions={
          <Button size="sm" onClick={openNueva}>
            <Plus className="size-3.5" />Nueva
          </Button>
        }
      />

      {/* Filtros */}
      <Tabs value={filtro} onValueChange={v => setFiltro(v as EstadoPrestacion | 'todas')}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50">
          <TabsTrigger value="todas" className="text-xs">Todas</TabsTrigger>
          <TabsTrigger value="realizada" className="text-xs">Sin boleta</TabsTrigger>
          <TabsTrigger value="boleta_emitida" className="text-xs">Pendiente pago</TabsTrigger>
          <TabsTrigger value="pagada" className="text-xs">Pagadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Sin prestaciones"
          description={filtro === 'todas' ? 'Registra tu primera prestación' : 'No hay prestaciones en este estado'}
          action={
            filtro === 'todas' ? (
              <Button size="sm" onClick={openNueva}>
                <Plus className="size-3.5" />Nueva prestación
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={cn(
                'text-left w-full bg-card border border-border rounded-lg p-4 shadow-none',
                'hover:border-primary/40 hover:shadow-sm transition-all duration-150 cursor-pointer'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{p.institucion_nombre}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {p.tipo_prestacion} · {formatFechaCorta(p.fecha_prestacion)}
                  </p>
                </div>
                {getEstadoBadge(p)}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <Money value={isNaN(p.monto_neto) ? Math.round(p.monto_bruto * (1 - (p.retencion_pct || 0) / 100)) : p.monto_neto} size="lg" className="text-success" />
                  <p className="text-xs text-foreground mt-0.5">
                    Bruto: <Money value={p.monto_bruto} size="sm" />
                  </p>
                </div>
                {p.estado === 'realizada' && p.fecha_limite_boleta && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Emitir boleta</p>
                    <p className={cn('text-xs font-semibold mt-0.5',
                      diasHasta(p.fecha_limite_boleta) < 0 ? 'text-destructive' :
                      diasHasta(p.fecha_limite_boleta) <= 3 ? 'text-warning' : 'text-muted-foreground'
                    )}>{formatFechaCorta(p.fecha_limite_boleta)}</p>
                  </div>
                )}
                {p.estado === 'boleta_emitida' && p.fecha_limite_pago && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Pago esperado</p>
                    <p className={cn('text-xs font-semibold mt-0.5',
                      diasHasta(p.fecha_limite_pago) < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}>{formatFechaCorta(p.fecha_limite_pago)}</p>
                  </div>
                )}
                {p.estado === 'pagada' && p.fecha_pago_recibido && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Pagado</p>
                    <p className="text-xs font-semibold mt-0.5 text-success">{formatFechaCorta(p.fecha_pago_recibido)}</p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Nueva prestación modal ── */}
      <Dialog open={showNueva} onOpenChange={open => !open && closeNueva()}>
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

          <div className="px-6 py-5 min-h-[220px]">
            {/* Step 1: Institución */}
            {form.step === 'institucion' && (
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
                        onClick={() => form.setInstitucionId(i.id)}
                        className={cn(
                          'text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium',
                          form.institucionId === i.id
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
            {form.step === 'tipo' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">¿Qué tipo de prestación?</p>
                  <p className="text-sm text-muted-foreground">{form.institucionNombre}</p>
                </div>
                {form.tiposDisponibles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.tiposDisponibles.map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => form.setTipoPrestacion(tipo)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                          form.tipoPrestacion === tipo
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
                    {form.tiposDisponibles.length > 0 ? 'O escribe uno nuevo' : 'Tipo de prestación'}
                  </Label>
                  <Input
                    id="tipo-prestacion"
                    placeholder="Cirugía, Endoscopia, Turno..."
                    value={form.tipoPrestacion}
                    onChange={e => form.setTipoPrestacion(e.target.value)}
                    autoFocus
                  />
                </div>
                {form.reglaAplicable && (
                  <Alert className="border-primary/30 bg-primary/5 py-2">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    <AlertDescription className="text-xs text-foreground">
                      Boleta en {form.reglaAplicable.dias_emitir_boleta}d · Pago en {form.reglaAplicable.dias_recibir_pago}d
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 3: Fecha y monto */}
            {form.step === 'monto' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">Fecha y monto</p>
                  <p className="text-sm text-muted-foreground">{form.tipoPrestacion}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fecha">Fecha de la prestación</Label>
                  <Input id="fecha" type="date" value={form.fecha} onChange={e => form.setFecha(e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => form.setEsTurno(!form.esTurno)}
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors shrink-0',
                      form.esTurno ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                    role="switch" aria-checked={form.esTurno}
                  >
                    <span className={cn(
                      'absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow transition-transform',
                      form.esTurno && 'translate-x-5'
                    )} />
                  </button>
                  <span className="text-sm">Es turno (pago por horas)</span>
                </div>
                {form.esTurno ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="horas">Horas</Label>
                      <Input id="horas" type="number" min="0" step="0.5" placeholder="8" inputMode="numeric" value={form.horas} onChange={e => form.setHoras(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="valor-hora">Valor/hora</Label>
                      <Input id="valor-hora" type="number" min="0" placeholder="50000" inputMode="numeric" value={form.valorHora} onChange={e => form.setValorHora(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="monto">Monto bruto ($)</Label>
                    <Input id="monto" type="number" min="0" placeholder="500000" inputMode="numeric" value={form.montoBruto} onChange={e => form.setMontoBruto(e.target.value)} />
                  </div>
                )}
                {form.montoBrutoCalculado > 0 && (
                  <div className="bg-muted/40 rounded-lg p-3 flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bruto</span>
                      <Money value={form.montoBrutoCalculado} size="sm" />
                    </div>
                    {form.retencionPct > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Retención {form.retencionPct.toFixed(1)}%</span>
                        <Money value={-form.montoRetencion} size="sm" showSign />
                      </div>
                    )}
                    <Separator className="my-0.5" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Neto</span>
                      <Money value={form.montoNeto} size="sm" className="text-success" />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {(['boleta', 'factura'] as const).map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => form.setTipoDocumento(tipo)}
                      className={cn(
                        'flex-1 py-2 rounded-md text-xs font-medium border transition-colors capitalize',
                        form.tipoDocumento === tipo
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
            {form.step === 'confirmar' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">¿Todo correcto?</p>
                  <p className="text-sm text-muted-foreground">Revisa antes de guardar</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 flex flex-col gap-2.5 text-sm">
                  <Row label="Institución" value={form.institucionNombre} />
                  <Row label="Prestación" value={form.tipoPrestacion} />
                  <Row label="Fecha" value={form.fecha.split('-').reverse().join('/')} />
                  <Separator />
                  <Row label="Monto bruto" value={<Money value={form.montoBrutoCalculado} size="sm" />} />
                  <Row label="Neto a recibir" value={<Money value={form.montoNeto} size="sm" className="text-success" />} bold />
                  <Row label="Documento" value={form.tipoDocumento} />
                  {form.fechaLimiteBoleta && (
                    <Row label="Límite boleta" value={form.fechaLimiteBoleta.split('-').reverse().join('/')} />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notas">Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <Textarea
                    id="notas"
                    rows={2}
                    placeholder="Observaciones..."
                    value={form.notas}
                    onChange={e => form.setNotas(e.target.value)}
                    className="resize-none"
                  />
                </div>
                {form.error && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs">{form.error}</AlertDescription>
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
              onClick={stepIdx === 0 ? closeNueva : form.back}
              disabled={form.loading}
            >
              {stepIdx === 0 ? 'Cancelar' : <><ArrowLeft className="size-3.5" />Atrás</>}
            </Button>

            {form.step !== 'confirmar' ? (
              <Button
                size="sm"
                onClick={form.next}
                disabled={!form.canAdvance()}
              >
                Siguiente<ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={form.loading}
                onClick={() => form.submit(newP => {
                  setPrestaciones(prev => [newP, ...prev])
                  toast.success('Prestación registrada')
                  closeNueva()
                  router.refresh()
                })}
              >
                {form.loading ? 'Guardando…' : 'Guardar'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0">
          {selected && (
            <PrestacionDetalle
              prestacion={selected}
              onClose={() => setSelected(null)}
              onBoletaEmitida={marcarBoletaEmitida}
              onPagada={marcarPagada}
              onEliminar={eliminarPrestacion}
              onEditar={editarPrestacion}
            />
          )}
        </SheetContent>
      </Sheet>
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

function calcularFechaLimitePago(fechaBoleta: string): string {
  const d = new Date(fechaBoleta)
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}
