'use client'

import { useState } from 'react'
import { Plus, Building2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Institucion, ReglasPlazo } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

interface Props {
  instituciones: Institucion[]
  reglas: ReglasPlazo[]
}

export default function InstitucionesClient({ instituciones: init, reglas: initReglas }: Props) {
  const supabase = createClient()

  const [instituciones, setInstituciones] = useState(init)
  const [reglas, setReglas] = useState(initReglas)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFormInstitucion, setShowFormInstitucion] = useState(false)
  const [showFormRegla, setShowFormRegla] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form institución
  const [nombreInst, setNombreInst] = useState('')
  const [rutInst, setRutInst] = useState('')

  // Form regla
  const [tipoPrestacion, setTipoPrestacion] = useState('')
  const [diasBoleta, setDiasBoleta] = useState('5')
  const [diasPago, setDiasPago] = useState('30')

  async function crearInstitucion() {
    if (!nombreInst.trim()) return
    setLoading(true)
    setError('')

    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No autenticado. Intenta cerrar sesión y volver a abrir.')
      setLoading(false)
      return
    }

    const { data, error: dbError } = await supabase
      .from('instituciones')
      .insert({
        user_id: user.id,
        nombre: nombreInst.trim(),
        rut: rutInst.trim() || null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error al crear institución:', dbError)
      setError(`Error: ${dbError.message || 'No se pudo guardar'}`)
      setLoading(false)
      return
    }

    if (data) {
      setInstituciones(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNombreInst('')
      setRutInst('')
      setShowFormInstitucion(false)
      setError('')
    }
    setLoading(false)
  }

  async function eliminarInstitucion(id: string) {
    if (!confirm('¿Eliminar esta institución? Se eliminarán también sus reglas de plazo.')) return
    await supabase.from('instituciones').delete().eq('id', id)
    setInstituciones(prev => prev.filter(i => i.id !== id))
    setReglas(prev => prev.filter(r => r.institucion_id !== id))
  }

  async function crearRegla(institucionId: string) {
    if (!tipoPrestacion.trim()) return
    setLoading(true)
    setError('')

    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No autenticado. Intenta cerrar sesión y volver a abrir.')
      setLoading(false)
      return
    }

    const { data, error: dbError } = await supabase
      .from('reglas_plazo')
      .upsert({
        user_id: user.id,
        institucion_id: institucionId,
        tipo_prestacion_nombre: tipoPrestacion.trim(),
        dias_emitir_boleta: parseInt(diasBoleta),
        dias_recibir_pago: parseInt(diasPago),
      }, { onConflict: 'institucion_id,tipo_prestacion_nombre' })
      .select()
      .single()

    if (dbError) {
      console.error('Error al crear regla:', dbError)
      setError(`Error: ${dbError.message || 'No se pudo guardar'}`)
      setLoading(false)
      return
    }

    if (data) {
      setReglas(prev => {
        const idx = prev.findIndex(r => r.institucion_id === institucionId && r.tipo_prestacion_nombre === tipoPrestacion.trim())
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = data
          return next
        }
        return [...prev, data]
      })
      setTipoPrestacion('')
      setDiasBoleta('5')
      setDiasPago('30')
      setShowFormRegla(null)
      setError('')
    }
    setLoading(false)
  }

  async function eliminarRegla(id: string) {
    await supabase.from('reglas_plazo').delete().eq('id', id)
    setReglas(prev => prev.filter(r => r.id !== id))
  }

  const reglasDeInstitucion = (id: string) => reglas.filter(r => r.institucion_id === id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lugares de trabajo"
        subtitle="Instituciones y plazos de cobro"
        actions={
          <Button size="sm" onClick={() => setShowFormInstitucion(v => !v)}>
            <Plus className="size-3.5" /> Agregar
          </Button>
        }
      />

      {/* Form nueva institución */}
      {showFormInstitucion && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <p className="text-sm font-semibold text-foreground">Nueva institución</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre-inst">Nombre</Label>
              <Input
                id="nombre-inst"
                placeholder="Clínica Las Condes, Hospital DIPRECA…"
                value={nombreInst}
                onChange={e => setNombreInst(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rut-inst">RUT <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                id="rut-inst"
                placeholder="76.XXX.XXX-X"
                value={rutInst}
                onChange={e => setRutInst(e.target.value)}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button onClick={crearInstitucion} disabled={loading} className="flex-1">
                {loading ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={() => setShowFormInstitucion(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {instituciones.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="Sin instituciones"
          description="Agrega tus clínicas u hospitales"
          action={
            <Button size="sm" onClick={() => setShowFormInstitucion(true)}>
              <Plus className="size-3.5" /> Agregar institución
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {instituciones.map(inst => {
            const expanded = expandedId === inst.id
            const reglasInst = reglasDeInstitucion(inst.id)
            return (
              <Card key={inst.id} className="border-border/60 overflow-hidden">
                {/* Header row */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : inst.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="size-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-foreground">{inst.nombre}</p>
                      {inst.rut && <p className="text-xs text-muted-foreground">RUT {inst.rut}</p>}
                      <p className="text-xs text-muted-foreground">
                        {reglasInst.length} {reglasInst.length === 1 ? 'regla' : 'reglas'} de plazo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); eliminarInstitucion(inst.id) }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Eliminar institución"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    {expanded
                      ? <ChevronUp className="size-4 text-muted-foreground" />
                      : <ChevronDown className="size-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Reglas expandidas */}
                {expanded && (
                  <>
                    <Separator />
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between py-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reglas de plazo</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setShowFormRegla(showFormRegla === inst.id ? null : inst.id)}
                        >
                          <Plus className="size-3" /> Agregar regla
                        </Button>
                      </div>

                      {showFormRegla === inst.id && (
                        <div className="bg-muted/40 rounded-lg p-3 mb-3 flex flex-col gap-3">
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`tipo-${inst.id}`}>Tipo de prestación</Label>
                            <Input
                              id={`tipo-${inst.id}`}
                              placeholder="Cirugía, Endoscopia, Turno…"
                              value={tipoPrestacion}
                              onChange={e => setTipoPrestacion(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor={`dias-boleta-${inst.id}`}>Días boleta</Label>
                              <Input
                                id={`dias-boleta-${inst.id}`}
                                type="number"
                                min="0"
                                value={diasBoleta}
                                onChange={e => setDiasBoleta(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">Desde la prestación</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor={`dias-pago-${inst.id}`}>Días cobro</Label>
                              <Input
                                id={`dias-pago-${inst.id}`}
                                type="number"
                                min="0"
                                value={diasPago}
                                onChange={e => setDiasPago(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">Desde la boleta</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => crearRegla(inst.id)} disabled={loading} className="flex-1">
                              {loading ? 'Guardando…' : 'Guardar'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowFormRegla(null)} className="flex-1">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {reglasInst.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">Sin reglas configuradas</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {reglasInst.map(regla => (
                            <div key={regla.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2.5">
                              <div>
                                <p className="text-sm font-medium text-foreground">{regla.tipo_prestacion_nombre}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Boleta en {regla.dias_emitir_boleta}d · Cobro en {regla.dias_recibir_pago}d
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => eliminarRegla(regla.id)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                aria-label="Eliminar regla"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
