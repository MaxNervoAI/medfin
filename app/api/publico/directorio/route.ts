import { createPublicClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Búsqueda pública en el directorio de instituciones (sin login).
 * Solo devuelve filas verificadas: usa el cliente anónimo, así que la
 * política RLS de la migración 015 es la que filtra — no este código.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (q.length < 2) {
    return NextResponse.json({ instituciones: [] })
  }

  const supabase = createPublicClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 })
  }

  const { data, error } = await supabase.rpc('buscar_directorio', {
    termino: q.slice(0, 80),
    limite: 20,
  })

  if (error) {
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }

  // Exponer solo lo que la página pública necesita
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instituciones = (data ?? []).map((d: any) => ({
    id: d.id,
    nombre: d.nombre,
    ciudad: d.ciudad,
    region: d.region,
    tipo: d.tipo,
  }))

  return NextResponse.json(
    { instituciones },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  )
}
