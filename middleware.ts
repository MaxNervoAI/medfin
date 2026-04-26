import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Si las variables de entorno no están configuradas, permitir acceso a /login
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { pathname } = request.nextUrl
    const publicPaths = ['/login', '/auth/callback']
    if (publicPaths.some(p => pathname.startsWith(p))) {
      return supabaseResponse
    }
    // Redirigir a login si falta configuración
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  // Debug mode: allow bypassing auth in development (via query param or env var)
  const isDebugQuery = url.searchParams.get('debug') === 'true' && process.env.NODE_ENV === 'development'
  const isJsonDbMode = process.env.NEXT_PUBLIC_USE_JSON_DB === 'true' && process.env.NODE_ENV === 'development'
  const isDebug = isDebugQuery || isJsonDbMode

  // Rutas públicas
  const publicPaths = ['/login', '/auth/callback']
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return supabaseResponse
  }

  // Si no hay sesión y no es debug mode, redirigir a login
  if (!user && !isDebug) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay sesión y va a /, redirigir a dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
