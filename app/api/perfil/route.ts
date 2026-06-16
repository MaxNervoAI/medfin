import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const URL_OPTIONAL = z.string().url().optional().or(z.literal('').transform(() => undefined))

const profileUpdateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  telefono: z.string().max(20).optional().or(z.literal('').transform(() => undefined)),
  email_contacto: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  numero_licencia: z.string().max(50).optional().or(z.literal('').transform(() => undefined)),
  bio: z.string().max(500).optional().or(z.literal('').transform(() => undefined)),
  linkedin_url: URL_OPTIONAL,
  instagram_url: URL_OPTIONAL,
  twitter_url: URL_OPTIONAL,
  especialidades: z.array(z.object({ id: z.string().uuid() })).optional(),
})

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
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Fetch user's specialties
    const { data: especialidades, error: especialidadesError } = await supabase
      .from('perfil_especialidades')
      .select('especialidad_id, especialidades (nombre, tipo)')
      .eq('perfil_id', user.id)

    if (especialidadesError) {
      console.error('Especialidades fetch error:', especialidadesError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
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
    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

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
    } = parsed.data

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
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
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
          console.error('Especialidades insert error:', insertResult.error)
          return NextResponse.json({ error: 'Failed to update specialties' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
