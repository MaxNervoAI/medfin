import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createJsonDbClient } from '@/lib/db/json-db'

export async function createClient() {
  // Use JSON file-based DB for local development
  if (process.env.NEXT_PUBLIC_USE_JSON_DB === 'true') {
    return createJsonDbClient()
  }

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
