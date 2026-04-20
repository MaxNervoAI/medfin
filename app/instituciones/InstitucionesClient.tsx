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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--ink)', margin: 0 }}>
            Lugares de trabajo
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--ink-3)', marginTop: '4px', margin: 0 }}>
            Instituciones y plazos de cobro
          </p>
        </div>
        <button onClick={() => setShowFormInstitucion(true)} className="btn btn-primary btn-sm">
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* Formulario nueva institución */}
      {showFormInstitucion && (
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '16px', margin: 0 }}>
            Nueva institución
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <div style={{
                background: 'var(--red-weak)',
                color: 'var(--red)',
                fontSize: '14px',
                borderRadius: '8px',
                padding: '8px 12px',
              }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button onClick={crearInstitucion} loading={loading} style={{ flex: 1 }}>
                Guardar
              </Button>
              <Button variant="secondary" onClick={() => setShowFormInstitucion(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de instituciones */}
      {instituciones.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '64px', paddingBottom: '64px', color: 'var(--ink-3)' }}>
          <Building2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 500, margin: '8px 0 0 0' }}>Sin instituciones</p>
          <p style={{ fontSize: '14px', margin: '0' }}>Agrega tus clínicas u hospitales</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {instituciones.map(inst => {
            const expanded = expandedId === inst.id
            const reglasInst = reglasDeInstitucion(inst.id)
            return (
              <div
                key={inst.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--line)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(expanded ? null : inst.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: 'var(--accent-weak)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Building2 size={18} style={{ color: 'var(--accent-strong)' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{inst.nombre}</p>
                      {inst.rut && <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '4px 0 0 0' }}>RUT {inst.rut}</p>}
                      <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '0' }}>
                        {reglasInst.length} {reglasInst.length === 1 ? 'regla' : 'reglas'} de plazo
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); eliminarInstitucion(inst.id) }}
                      style={{
                        padding: '6px',
                        color: 'var(--ink-4)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.color = 'var(--red)';
                        (e.target as HTMLElement).style.background = 'var(--red-weak)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.color = 'var(--ink-4)';
                        (e.target as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                    {expanded ? (
                      <ChevronUp size={16} style={{ color: 'var(--ink-3)' }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: 'var(--ink-3)' }} />
                    )}
                  </div>
                </div>

                {/* Reglas de plazo */}
                {expanded && (
                  <div style={{ borderTop: '1px solid var(--line)', padding: '0 16px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingY: '12px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-2)', margin: 0 }}>
                        Reglas de plazo
                      </p>
                      <button
                        onClick={() => setShowFormRegla(showFormRegla === inst.id ? null : inst.id)}
                        style={{
                          fontSize: '12px',
                          color: 'var(--accent)',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                        }}
                      >
                        <Plus size={13} /> Agregar regla
                      </button>
                    </div>

                    {showFormRegla === inst.id && (
                      <div style={{
                        background: 'var(--bg)',
                        borderRadius: '12px',
                        padding: '12px',
                        marginBottom: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}>
                        <Input
                          label="Tipo de prestación"
                          placeholder="Cirugía, Endoscopia, Turno..."
                          value={tipoPrestacion}
                          onChange={e => setTipoPrestacion(e.target.value)}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button size="sm" onClick={() => crearRegla(inst.id)} loading={loading} style={{ flex: 1 }}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setShowFormRegla(null)} style={{ flex: 1 }}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {reglasInst.length === 0 ? (
                      <p style={{ fontSize: '14px', color: 'var(--ink-3)', padding: '8px 0', margin: 0 }}>
                        Sin reglas configuradas
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {reglasInst.map(regla => (
                          <div
                            key={regla.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'var(--bg)',
                              borderRadius: '12px',
                              padding: '10px 12px',
                            }}
                          >
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-2)', margin: 0 }}>
                                {regla.tipo_prestacion_nombre}
                              </p>
                              <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '4px 0 0 0' }}>
                                Boleta en {regla.dias_emitir_boleta}d · Cobro en {regla.dias_recibir_pago}d
                              </p>
                            </div>
                            <button
                              onClick={() => eliminarRegla(regla.id)}
                              style={{
                                padding: '6px',
                                color: 'var(--ink-4)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.color = 'var(--red)';
                                (e.target as HTMLElement).style.background = 'var(--red-weak)';
                              }}
                              onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.color = 'var(--ink-4)';
                                (e.target as HTMLElement).style.background = 'transparent';
                              }}
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
