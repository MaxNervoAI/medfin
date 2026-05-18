import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Fetch user's specialties
    const { data: especialidades, error: especialidadesError } = await supabase
      .from('perfil_especialidades')
      .select('especialidad_id, especialidades (nombre, tipo)')
      .eq('perfil_id', user.id)

    if (especialidadesError) {
      return NextResponse.json({ error: especialidadesError.message }, { status: 500 })
    }

    return NextResponse.json({
      profile,
      especialidades: especialidades?.map(e => e.especialidades) || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nombre,
      telefono,
      email_contacto,
      numero_licencia,
      bio,
      linkedin_url,
      instagram_url,
      twitter_url,
      especialidades
    } = body

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nombre,
        telefono,
        email_contacto,
        numero_licencia,
        bio,
        linkedin_url,
        instagram_url,
        twitter_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Fetch updated profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Update specialties if provided
    if (especialidades && Array.isArray(especialidades)) {
      // Delete existing specialties
      await supabase
        .from('perfil_especialidades')
        .delete()
        .eq('perfil_id', user.id)

      // Insert new specialties
      if (especialidades.length > 0) {
        const specialtyInserts = especialidades.map((especialidad: any) => ({
          perfil_id: user.id,
          especialidad_id: especialidad.id
        }))

        const insertResult = await supabase
          .from('perfil_especialidades')
          .insert(specialtyInserts)
          .select() as any

        if (insertResult.error) {
          return NextResponse.json({ error: insertResult.error.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
