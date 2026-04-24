'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularFechaLimiteBoleta, formatMonto, getTaxRate } from '@/lib/utils'
import type { Institucion, ReglasPlazo } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ArrowLeft, Info } from 'lucide-react'

interface Props {
  instituciones: Pick<Institucion, 'id' | 'nombre'>[]
  reglas: ReglasPlazo[]
}

export default function NuevaPrestacionForm({ instituciones, reglas }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [taxRate, setTaxRate] = useState<number>(0.145)

  // Fetch dynamic tax rate on mount
  useEffect(() => {
    getTaxRate(supabase).then(rate => setTaxRate(rate))
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

    const { error: dbError } = await supabase.from('prestaciones').insert({
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
    })

    if (dbError) {
      console.error('Error al guardar prestación:', dbError)
      setError(`Error: ${dbError.message || 'No se pudo guardar'}`)
      setLoading(false)
      return
    }

    router.push('/prestaciones')
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registrar prestación</h1>
          <p className="text-sm text-slate-500">Agrega un procedimiento, cirugía o turno</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Institución */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Lugar de trabajo</h2>
          <Select
            label="Institución"
            placeholder="Selecciona una institución"
            value={institucionId}
            onChange={e => { setInstitucionId(e.target.value); setTipoPrestacion('') }}
            options={instituciones.map(i => ({ value: i.id, label: i.nombre }))}
          />
          {instituciones.length === 0 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <Info size={12} /> Primero agrega una institución en &quot;Lugares&quot;
            </p>
          )}
        </div>

        {/* Tipo de prestación */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Tipo de prestación</h2>

          {tiposDisponibles.length > 0 ? (
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-2">Tipos configurados para esta institución:</p>
              <div className="flex flex-wrap gap-2">
                {tiposDisponibles.map(tipo => (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => setTipoPrestacion(tipo.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      tipoPrestacion === tipo.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">O escribe uno nuevo:</p>
            </div>
          ) : null}

          <Input
            placeholder="Cirugía, Endoscopia, Turno, Consulta..."
            value={tipoPrestacion}
            onChange={e => setTipoPrestacion(e.target.value)}
          />

          {reglaAplicable && (
            <div className="mt-3 bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">Regla aplicada: {reglaAplicable.tipo_prestacion_nombre}</p>
              <p>Emitir boleta en {reglaAplicable.dias_emitir_boleta} días · Cobro en {reglaAplicable.dias_recibir_pago} días</p>
              {fechaLimiteBoleta && (
                <p className="mt-1 font-semibold">Fecha límite boleta: {fechaLimiteBoleta.split('-').reverse().join('/')}</p>
              )}
            </div>
          )}
        </div>

        {/* Fecha y monto */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Fecha y monto</h2>
          <div className="flex flex-col gap-3">
            <Input
              label="Fecha de la prestación"
              type="date"
              value={fechaPrestacion}
              onChange={e => setFechaPrestacion(e.target.value)}
            />

            {/* Toggle turno */}
            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setEsTurno(!esTurno)}
                className={`relative w-12 h-6 rounded-full transition-colors ${esTurno ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${esTurno ? 'translate-x-6' : ''}`} />
              </button>
              <span className="text-sm text-slate-700 font-medium">Es turno (pago por horas)</span>
            </div>

            {esTurno ? (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Horas trabajadas"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="8"
                  value={horas}
                  onChange={e => setHoras(e.target.value)}
                />
                <Input
                  label="Valor por hora ($)"
                  type="number"
                  min="0"
                  placeholder="50000"
                  value={valorHora}
                  onChange={e => setValorHora(e.target.value)}
                />
              </div>
            ) : (
              <Input
                label="Monto bruto ($)"
                type="number"
                min="0"
                placeholder="500000"
                value={montoBruto}
                onChange={e => setMontoBruto(e.target.value)}
              />
            )}

            {/* Resumen de montos */}
            {montoBrutoCalculado > 0 && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Monto bruto</span>
                  <span className="font-semibold text-slate-800">{formatMonto(montoBrutoCalculado)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Retención {retencionPct}%</span>
                  <span className={retencionPct > 0 ? "text-red-500" : "text-slate-400"}>- {formatMonto(montoRetencion)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-1.5 mt-1.5">
                  <span className="text-slate-700">Monto neto a recibir</span>
                  <span className="text-green-600">{formatMonto(montoNeto)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documento */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Tipo de documento</h2>
          <div className="flex gap-2">
            {(['boleta', 'factura'] as const).map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoDocumento(tipo)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors capitalize ${
                  tipoDocumento === tipo
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Notas (opcional)</h2>
          <textarea
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Número de pacientes, observaciones..."
            value={notas}
            onChange={e => setNotas(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Guardar prestación
        </Button>
      </form>
    </div>
  )
}
