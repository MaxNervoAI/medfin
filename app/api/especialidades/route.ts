import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')

    const supabase = await createClient()

    let query = supabase
      .from('especialidades')
      .select('*')
      .eq('activa', true)

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    const { data: especialidades, error } = await query.order('nombre')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ especialidades })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
