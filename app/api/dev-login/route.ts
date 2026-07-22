import { createCookieClient } from '@/lib/supabase/server'
import { isDevLoginEnabled } from '@/lib/auth/dev-login'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Inicia sesión con el usuario de pruebas local.
 * Fuera de desarrollo esta ruta responde 404, como si no existiera.
 */
export async function POST() {
  if (!isDevLoginEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createCookieClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.DEV_LOGIN_EMAIL!,
    password: process.env.DEV_LOGIN_PASSWORD!,
  })

  if (error || !data.user) {
    console.error('[dev-login] Falló el inicio de sesión:', error?.message)
    return NextResponse.json(
      {
        error: 'No se pudo iniciar sesión con el usuario de pruebas.',
        details: error?.message,
        hint: 'Crea el usuario con: node scripts/create-dev-user.mjs',
      },
      { status: 401 }
    )
  }

  return NextResponse.json({ success: true, email: data.user.email })
}
