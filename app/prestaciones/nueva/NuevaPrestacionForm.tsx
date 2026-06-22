'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularFechaLimiteBoleta, getTaxRate } from '@/lib/utils'
import type { Institucion, ReglasPlazo } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Money } from '@/components/ui/Money'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import InstitucionCombobox from '@/components/ui/InstitucionCombobox'
import TipoPrestacionCombobox from '@/components/ui/TipoPrestacionCombobox'

interface Props {
  instituciones: Pick<Institucion, 'id' | 'nombre' | 'directorio_id'>[]
  reglas: ReglasPlazo[]
}

export default function NuevaPrestacionForm({ instituciones: initialInstituciones, reglas }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [taxRate, setTaxRate] = useState<number>(0.145)
  const [instituciones, setInstituciones] = useState(initialInstituciones)

  // Fetch dynamic tax rate on mount
  useEffect(() => {
    getTaxRate(supabase).then(rate => {
      // Normalize: if rate > 1, assume it's stored as percentage (14.5) and convert to decimal (0.145)
      const normalizedRate = rate > 1 ? rate / 100 : rate
      setTaxRate(normalizedRate)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Campos del formulario
  const [institucionId, setInstitucionId] = useState('')
  const [tipoPrestacion, setTipoPrestacion] = useState('')
  const [esTurno, setEsTurno] = useState(false)
  const [fechaPrestacion, setFechaPrestacion] = useState(new Date().toISOString().split('T')[0])
  const [montoBruto, setMontoBruto] = useState('')
  const [horas, setHoras] = useState('')
  const [valorHora, setValorHora] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState<'boleta' | 'factura'>('boleta')
  const [notas, setNotas] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Regla aplicable
  const [reglaAplicable, setReglaAplicable] = useState<ReglasPlazo | null>(null)

  // Tipos de prestación disponibles para la institución seleccionada
  const tiposDisponibles = reglas
    .filter(r => r.institucion_id === institucionId)
    .map(r => ({ value: r.tipo_prestacion_nombre, label: r.tipo_prestacion_nombre }))

  useEffect(() => {
    const regla = reglas.find(
      r => r.institucion_id === institucionId && r.tipo_prestacion_nombre === tipoPrestacion
    ) ?? null
    setReglaAplicable(regla)
    // Detectar si es turno por nombre
    setEsTurno(tipoPrestacion.toLowerCase().includes('turno'))
  }, [institucionId, tipoPrestacion, reglas])

  // Calcular monto bruto desde horas cuando es turno
  const montoBrutoCalculado = esTurno && horas && valorHora
    ? (parseFloat(horas) * parseFloat(valorHora))
    : parseFloat(montoBruto) || 0

  // Retención dinámica desde tax_settings (default 14.5%)
  const retencionPct = tipoDocumento === 'boleta' ? taxRate * 100 : 0
  const retencionDisplay = tipoDocumento === 'boleta' ? (taxRate * 100).toFixed(2) : '0.00'
  const montoRetencion = Math.round(montoBrutoCalculado * retencionPct / 100)
  const montoNeto = Math.round(montoBrutoCalculado * (1 - retencionPct / 100))

  const fechaLimiteBoleta = reglaAplicable && fechaPrestacion
    ? calcularFechaLimiteBoleta(fechaPrestacion, reglaAplicable.dias_emitir_boleta)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!institucionId) { setError('Selecciona una institución'); return }
    if (!tipoPrestacion.trim()) { setError('Ingresa el tipo de prestación'); return }
    if (montoBrutoCalculado <= 0) { setError('El monto debe ser mayor a 0'); return }

    setLoading(true)
    setError('')

    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No autenticado. Intenta cerrar sesión y volver a abrir.')
      setLoading(false)
      return
    }

    const institucion = instituciones.find(i => i.id === institucionId)

    const { data: prestacionData, error: dbError } = await supabase.from('prestaciones').insert({
      user_id: user.id,
      institucion_id: institucionId,
      institucion_nombre: institucion?.nombre ?? '',
      tipo_prestacion: tipoPrestacion.trim(),
      es_turno: esTurno,
      fecha_prestacion: fechaPrestacion,
      monto_bruto: montoBrutoCalculado,
      retencion_pct: retencionPct,
      horas: esTurno ? parseFloat(horas) : null,
      valor_hora: esTurno ? parseFloat(valorHora) : null,
      tipo_documento: tipoDocumento,
      notas: notas.trim() || null,
      estado: 'realizada',
      fecha_limite_boleta: fechaLimiteBoleta,
    }).select().single()

    if (dbError) {
      console.error('Error al guardar prestación:', dbError)
      setError(`Error: ${dbError.message || 'No se pudo guardar'}`)
      setLoading(false)
      return
    }

    // Upload files if any
    if (files.length > 0) {
      setUploadingFiles(true)
      try {
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          
          const response = await fetch(`/api/prestaciones/${prestacionData.id}/files/upload`, {
            method: 'POST',
            body: formData,
          })
          
          if (!response.ok) {
            console.error('Error uploading file:', file.name)
          }
        }
      } catch (error) {
        console.error('Error uploading files:', error)
      } finally {
        setUploadingFiles(false)
      }
    }

    router.push('/prestaciones')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => router.back()}
          aria-label="Volver"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl tracking-tight text-foreground leading-tight">Registrar prestación</h1>
          <p className="text-sm text-muted-foreground">Procedimiento, cirugía o turno</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Institución */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Lugar de trabajo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Institución</Label>
              <InstitucionCombobox
                value={institucionId || null}
                onChange={inst => {
                  setInstitucionId(inst.id)
                  setTipoPrestacion('')
                  if (!instituciones.find(i => i.id === inst.id)) {
                    setInstituciones(prev => [...prev, { ...inst, directorio_id: inst.directorio_id ?? null }])
                  }
                }}
                userInstituciones={instituciones}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tipo de prestación */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Tipo de prestación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
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
                <div className="flex flex-wrap gap-2">
                  {tiposDisponibles.map(tipo => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => setTipoPrestacion(tipo.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                        tipoPrestacion === tipo.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                      )}
                    >
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {reglaAplicable && (
              <Alert className="border-primary/30 bg-primary/5">
                <CheckCircle2 className="size-4 text-primary" />
                <AlertDescription className="text-xs text-foreground">
                  <span className="font-semibold">{reglaAplicable.tipo_prestacion_nombre}:</span>{' '}
                  Emitir boleta en {reglaAplicable.dias_emitir_boleta} días · Recibir pago en {reglaAplicable.dias_recibir_pago} días desde la boleta
                  {fechaLimiteBoleta && (
                    <span className="block font-semibold mt-0.5">
                      Límite boleta: {fechaLimiteBoleta.split('-').reverse().join('/')}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Fecha y monto */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Fecha y monto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-prestacion">Fecha de la prestación</Label>
              <Input
                id="fecha-prestacion"
                type="date"
                value={fechaPrestacion}
                onChange={e => setFechaPrestacion(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 py-1">
              <button
                type="button"
                onClick={() => setEsTurno(!esTurno)}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-colors shrink-0',
                  esTurno ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
                role="switch"
                aria-checked={esTurno}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow transition-transform',
                  esTurno && 'translate-x-5'
                )} />
              </button>
              <span className="text-sm text-foreground">Es turno (pago por horas)</span>
            </div>

            {esTurno ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="horas">Horas trabajadas</Label>
                  <Input id="horas" type="number" min="0" step="0.5" placeholder="8" value={horas} onChange={e => setHoras(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="valor-hora">Valor por hora ($)</Label>
                  <Input id="valor-hora" type="number" min="0" placeholder="50000" value={valorHora} onChange={e => setValorHora(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="monto-bruto">Monto bruto ($)</Label>
                <Input id="monto-bruto" type="number" min="0" placeholder="500000" value={montoBruto} onChange={e => setMontoBruto(e.target.value)} />
              </div>
            )}

            {montoBrutoCalculado > 0 && (
              <div className="bg-muted/40 rounded-lg p-3 flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto bruto</span>
                  <Money value={montoBrutoCalculado} size="sm" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retención {retencionDisplay}%</span>
                  <Money value={-montoRetencion} size="sm" showSign />
                </div>
                <Separator className="my-0.5" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Neto a recibir</span>
                  <Money value={montoNeto} size="sm" className="text-success" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipo documento */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Tipo de documento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['boleta', 'factura'] as const).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoDocumento(tipo)}
                  className={cn(
                    'flex-1 py-2 rounded-md text-sm font-medium border transition-colors capitalize',
                    tipoDocumento === tipo
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                  )}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notas <span className="font-normal text-muted-foreground">(opcional)</span></CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="Número de pacientes, observaciones..."
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Archivos adjuntos */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Archivos adjuntos <span className="font-normal text-muted-foreground">(opcional)</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault()
                const droppedFiles = Array.from(e.dataTransfer.files)
                setFiles(prev => [...prev, ...droppedFiles])
              }}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.accept = '.pdf,.jpg,.jpeg,.png,.gif,.txt,.md,.doc,.docx'
                input.onchange = (e) => {
                  const selectedFiles = Array.from((e.target as HTMLInputElement).files || [])
                  setFiles(prev => [...prev, ...selectedFiles])
                }
                input.click()
              }}
            >
              <p className="text-sm text-muted-foreground">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, imágenes, TXT, MD, DOC (máx. 10MB cada uno)
              </p>
            </div>
            {files.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-muted/40 rounded px-3 py-2">
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                      className="text-destructive hover:text-destructive/80 ml-2"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={loading || uploadingFiles} className="w-full">
          {uploadingFiles ? 'Subiendo archivos…' : loading ? 'Guardando…' : 'Guardar prestación'}
        </Button>
      </form>
    </div>
  )
}
