'use client'

import { useState } from 'react'
import { Plus, Building2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Institucion, ReglasPlazo } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--ink)] m-0">
            Lugares de trabajo
          </h1>
          <p className="text-[14px] text-[var(--ink-3)] mt-1 m-0">
            Instituciones y plazos de cobro
          </p>
        </div>
        <button onClick={() => setShowFormInstitucion(true)} className="btn btn-primary btn-sm">
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* Formulario nueva institución */}
      {showFormInstitucion && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--line)] px-4 py-4 mb-4 shadow-sm">
          <h3 className="font-semibold text-[var(--ink)] mb-4 m-0">
            Nueva institución
          </h3>
          <div className="flex flex-col gap-3">
            <Input
              label="Nombre"
              placeholder="Clínica Las Condes, Hospital DIPRECA..."
              value={nombreInst}
              onChange={e => setNombreInst(e.target.value)}
            />
            <Input
              label="RUT (opcional)"
              placeholder="76.XXX.XXX-X"
              value={rutInst}
              onChange={e => setRutInst(e.target.value)}
            />
            {error && (
              <div className="bg-[var(--red-weak)] text-[var(--red)] text-[14px] rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Button onClick={crearInstitucion} loading={loading} className="flex-1">
                Guardar
              </Button>
              <Button variant="secondary" onClick={() => setShowFormInstitucion(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de instituciones */}
      {instituciones.length === 0 ? (
        <div className="text-center py-16 text-[var(--ink-3)]">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium mt-2 mb-0">Sin instituciones</p>
          <p className="text-[14px] m-0">Agrega tus clínicas u hospitales</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {instituciones.map(inst => {
            const expanded = expandedId === inst.id
            const reglasInst = reglasDeInstitucion(inst.id)
            return (
              <div
                key={inst.id}
                className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--line)] shadow-sm overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-4 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : inst.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[var(--accent-weak)] rounded-xl flex items-center justify-center">
                      <Building2 size={18} className="text-[var(--accent-strong)]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--ink)] m-0">{inst.nombre}</p>
                      {inst.rut && <p className="text-[12px] text-[var(--ink-3)] mt-1 mb-0">RUT {inst.rut}</p>}
                      <p className="text-[12px] text-[var(--ink-3)] m-0">
                        {reglasInst.length} {reglasInst.length === 1 ? 'regla' : 'reglas'} de plazo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); eliminarInstitucion(inst.id) }}
                      className="p-1.5 text-[var(--ink-4)] rounded-lg cursor-pointer transition-all duration-150 hover:text-[var(--red)] hover:bg-[var(--red-weak)]"
                    >
                      <Trash2 size={15} />
                    </button>
                    {expanded ? (
                      <ChevronUp size={16} className="text-[var(--ink-3)]" />
                    ) : (
                      <ChevronDown size={16} className="text-[var(--ink-3)]" />
                    )}
                  </div>
                </div>

                {/* Reglas de plazo */}
                {expanded && (
                  <div className="border-t border-[var(--line)] px-4 pb-4">
                    <div className="flex items-center justify-between py-3">
                      <p className="text-[14px] font-semibold text-[var(--ink-2)] m-0">
                        Reglas de plazo
                      </p>
                      <button
                        onClick={() => setShowFormRegla(showFormRegla === inst.id ? null : inst.id)}
                        className="text-[12px] text-[var(--accent)] font-medium flex items-center gap-1 cursor-pointer px-2 py-1"
                      >
                        <Plus size={13} /> Agregar regla
                      </button>
                    </div>

                    {showFormRegla === inst.id && (
                      <div className="bg-[var(--bg)] rounded-xl p-3 mb-3 flex flex-col gap-3">
                        <Input
                          label="Tipo de prestación"
                          placeholder="Cirugía, Endoscopia, Turno..."
                          value={tipoPrestacion}
                          onChange={e => setTipoPrestacion(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Días para emitir boleta"
                            type="number"
                            min="0"
                            value={diasBoleta}
                            onChange={e => setDiasBoleta(e.target.value)}
                            hint="Desde la prestación"
                          />
                          <Input
                            label="Días para cobrar"
                            type="number"
                            min="0"
                            value={diasPago}
                            onChange={e => setDiasPago(e.target.value)}
                            hint="Desde la boleta"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => crearRegla(inst.id)} loading={loading} className="flex-1">
                            Guardar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setShowFormRegla(null)} className="flex-1">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {reglasInst.length === 0 ? (
                      <p className="text-[14px] text-[var(--ink-3)] py-2 m-0">
                        Sin reglas configuradas
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {reglasInst.map(regla => (
                          <div
                            key={regla.id}
                            className="flex items-center justify-between bg-[var(--bg)] rounded-xl px-3 py-2.5"
                          >
                            <div>
                              <p className="text-[14px] font-medium text-[var(--ink-2)] m-0">
                                {regla.tipo_prestacion_nombre}
                              </p>
                              <p className="text-[12px] text-[var(--ink-3)] mt-1 mb-0">
                                Boleta en {regla.dias_emitir_boleta}d · Cobro en {regla.dias_recibir_pago}d
                              </p>
                            </div>
                            <button
                              onClick={() => eliminarRegla(regla.id)}
                              className="p-1.5 text-[var(--ink-4)] rounded-lg cursor-pointer transition-all duration-150 hover:text-[var(--red)] hover:bg-[var(--red-weak)]"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
