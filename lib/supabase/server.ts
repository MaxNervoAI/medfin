import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createJsonDbClient } from '@/lib/db/json-db'

/**
 * Cliente con service role — omite RLS.
 * Solo para procesos sin sesión de usuario (cron, webhooks).
 * Nunca exponer al browser ni usar en rutas donde el usuario controla el filtro.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for service role operations.'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Cliente anónimo sin sesión ni cookies, para páginas y APIs públicas
 * (/calculadora, /directorio). RLS aplica con el rol `anon`: solo ve el
 * catálogo verificado y la tasa de retención (migración 015).
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Next parcha fetch y puede cachear en disco las respuestas de
      // PostgREST (se vio con resultados vacíos pre-migración 015 que
      // sobrevivían reinicios). Las consultas públicas van siempre en vivo.
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  })
}

export async function createClient() {
  // Use JSON file-based DB for local development
  if (process.env.NEXT_PUBLIC_USE_JSON_DB === 'true') {
    return createJsonDbClient()
  }

  return createCookieClient()
}

/**
 * Cliente Supabase real respaldado por cookies, sin la rama de JSON DB.
 * Úsalo cuando necesites la API de auth completa (por ejemplo signInWithPassword).
 */
export async function createCookieClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — ignorar
          }
        },
      },
    }
  )
}
