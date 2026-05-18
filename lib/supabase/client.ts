import { createBrowserClient } from '@supabase/ssr'
import { createJsonDbClient } from '@/lib/db/json-db-client'

export function createClient() {
  // Use JSON file-based DB for local development
  if (process.env.NEXT_PUBLIC_USE_JSON_DB === 'true') {
    return createJsonDbClient() as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment.'
    )
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
