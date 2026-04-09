'use client'

import Link from 'next/link'
import { generarAlertas, formatMonto, getNombreMes, getMesActual, calcularIngresosPorMes } from '@/lib/utils'
import type { Prestacion, Alerta } from '@/types'
import Badge from '@/components/ui/Badge'
import { AlertTriangle, Clock, TrendingUp, ChevronRight, Plus, Bell } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Props {
  nombre: string
  prestaciones: Prestacion[]
}

function AlertaCard({ alerta }: { alerta: Alerta }) {
  const config = {
    boleta_vencida: { color: 'border-red-200 bg-red-50', icon: AlertTriangle, iconColor: 'text-red-500', texto: 'Boleta VENCIDA', badge: 'danger' as const },
    boleta_vence_hoy: { color: 'border-amber-200 bg-amber-50', icon: AlertTriangle, iconColor: 'text-amber-500', texto: 'Emitir boleta HOY', badge: 'warning' as const },
    boleta_por_vencer: { color: 'border-amber-100 bg-amber-50', icon: Clock, iconColor: 'text-amber-500', texto: `Emitir en ${alerta.dias_restantes} día${alerta.dias_restantes !== 1 ? 's' : ''}`, badge: 'warning' as const },
    pago_vencido: { color: 'border-red-200 bg-red-50', icon: AlertTriangle, iconColor: 'text-red-500', texto: 'Pago VENCIDO', badge: 'danger' as const },
    pago_vence_hoy: { color: 'border-amber-200 bg-amber-50', icon: AlertTriangle, iconColor: 'text-amber-500', texto: 'Pago vence HOY', badge: 'warning' as const },
  }

  const c = config[alerta.tipo]
  const Icon = c.icon

  return (
    <Link href="/prestaciones" className={`flex items-center gap-3 p-3.5 rounded-2xl border ${c.color} active:opacity-80 transition-opacity`}>
      <div className={`shrink-0 ${c.iconColor}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{alerta.institucion_nombre}</p>
        <p className="text-xs text-slate-500">{alerta.tipo_prestacion} · {formatMonto(alerta.monto_bruto)}</p>
      </div>
      <Badge variant={c.badge} className="shrink-0 text-xs">{c.texto}</Badge>
    </Link>
  )
}

export default function DashboardClient({ nombre, prestaciones }: Props) {
  const mesActual = getMesActual()
  const nombreMes = getNombreMes(mesActual)
  const alertas = generarAlertas(prestaciones)

  // Resumen del mes
  const prestacionesMes = prestaciones.filter(p => {
    const mes = p.fecha_prestacion.substring(0, 7)
    const mesPago = p.fecha_pago_recibido?.substring(0, 7)
    return mes === mesActual || mesPago === mesActual
  })

  const totalEsperado = prestacionesMes
    .filter(p => p.estado !== 'pagada')
    .reduce((sum, p) => sum + p.monto_neto, 0)

  const totalCobrado = prestaciones
    .filter(p => p.estado === 'pagada' && p.fecha_pago_recibido?.startsWith(mesActual))
    .reduce((sum, p) => sum + p.monto_neto, 0)

  const sinBoleta = prestaciones.filter(p => p.estado === 'realizada').length
  const boletaEmitida = prestaciones.filter(p => p.estado === 'boleta_emitida').length

  const primerNombre = nombre.split(' ')[0]

  // Ingresos por mes - para gráfico de barras apiladas
  const ingresosPorMes = calcularIngresosPorMes(prestaciones)

  // Preparar datos para Recharts: convertir estructura de ingresos por tipo a formato apto para BarChart
  const chartData = ingresosPorMes.map(mes => {
    const obj: Record<string, string | number> = {
      mes: mes.nombre,
      mesKey: mes.mes,
      total: mes.total,
    }
    mes.ingresos.forEach(ing => {
      obj[ing.tipo] = ing.monto
    })
    return obj
  })

  // Obtener todos los tipos de prestación únicos (para colores)
  const tiposPrestacion: string[] = Array.from(
    new Set(ingresosPorMes.flatMap(mes => mes.ingresos.map(ing => ing.tipo)))
  ).sort() as string[]

  // Colores para cada tipo de prestación
  const colorPaletteMap: { [key: string]: string } = {
    'Cirugía': '#3b82f6',     // blue
    'Consulta': '#8b5cf6',    // violet
    'Procedimiento': '#ec4899', // pink
    'Turno': '#f59e0b',       // amber
    'Endoscopia': '#10b981',  // emerald
    'Diagnóstico': '#06b6d4', // cyan
  }

  const getColor = (tipo: string, index: number) => {
    return colorPaletteMap[tipo] || ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'][index % 7]
  }

  return (
    <div>
      {/* Saludo */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1 capitalize">{nombreMes}</p>
        <h1 className="text-2xl font-bold text-slate-800">Hola, {primerNombre} 👋</h1>
      </div>

      {/* Gráfico de ingresos: 3 meses atrás + actual + 3 meses adelante */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Proyección de ingresos</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(value: number) => value === 0 ? '$0' : `$${Math.round(value / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '13px',
              }}
              formatter={(value, name) => [
                formatMonto(Number(value)),
                name as string
              ]}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {tiposPrestacion.map((tipo, idx) => (
              <Bar
                key={tipo}
                dataKey={tipo}
                stackId="stack"
                fill={getColor(tipo, idx)}
                radius={idx === tiposPrestacion.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-3">Basado en fechas esperadas de pago según reglas configuradas</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 font-medium mb-3">Por cobrar</p>
          <p className="text-2xl font-bold text-slate-800">{formatMonto(totalEsperado)}</p>
          <p className="text-xs text-slate-400 mt-2">{boletaEmitida + sinBoleta} prestaciones</p>
          <div className="mt-3 h-1 bg-slate-100 rounded-full"><div className="h-1 bg-blue-500 rounded-full" style={{ width: '60%' }} /></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 font-medium mb-3">Cobrado este mes</p>
          <p className="text-2xl font-bold text-green-600">{formatMonto(totalCobrado)}</p>
          <p className="text-xs text-slate-400 mt-2">neto recibido</p>
          <div className="mt-3 h-1 bg-slate-100 rounded-full"><div className="h-1 bg-green-500 rounded-full" style={{ width: '80%' }} /></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 font-medium mb-3">Sin boleta</p>
          <p className="text-2xl font-bold text-amber-500">{sinBoleta}</p>
          <p className="text-xs text-slate-400 mt-2">pendientes de emitir</p>
          <div className="mt-3 h-1 bg-slate-100 rounded-full"><div className="h-1 bg-amber-400 rounded-full" style={{ width: `${Math.min((sinBoleta / 10) * 100, 100)}%` }} /></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 font-medium mb-3">Boleta emitida</p>
          <p className="text-2xl font-bold text-blue-500">{boletaEmitida}</p>
          <p className="text-xs text-slate-400 mt-2">esperando pago</p>
          <div className="mt-3 h-1 bg-slate-100 rounded-full"><div className="h-1 bg-blue-400 rounded-full" style={{ width: `${Math.min((boletaEmitida / 10) * 100, 100)}%` }} /></div>
        </div>
      </div>


      {/* Alertas */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-slate-600" />
            <h2 className="font-semibold text-slate-800">Alertas</h2>
          </div>
          {alertas.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {alertas.length}
            </span>
          )}
        </div>

        {alertas.length === 0 ? (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
            <p className="text-green-700 font-medium text-sm">Todo al día</p>
            <p className="text-green-600 text-xs mt-1">Sin alertas pendientes</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alertas.slice(0, 5).map(a => <AlertaCard key={a.id} alerta={a} />)}
            {alertas.length > 5 && (
              <Link href="/prestaciones" className="text-center text-sm text-blue-600 font-medium py-2">
                Ver {alertas.length - 5} alertas más →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Acceso rápido */}
      <div className="flex flex-col gap-2">
        <Link
          href="/prestaciones/nueva"
          className="flex items-center justify-between bg-blue-600 text-white rounded-2xl p-4 active:bg-blue-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Plus size={20} />
            <span className="font-semibold">Registrar prestación</span>
          </div>
          <ChevronRight size={18} />
        </Link>
        <Link
          href="/presupuesto"
          className="flex items-center justify-between bg-white border border-slate-200 text-slate-700 rounded-2xl p-4 active:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-slate-500" />
            <span className="font-semibold">Ver presupuesto del mes</span>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>
      </div>
    </div>
  )
}
