import { createBrowserClient } from '@supabase/ssr'
import { createJsonDbClient } from '@/lib/db/json-db-client'

export function createClient() {
  // Use JSON file-based DB for local development
  if (process.env.NEXT_PUBLIC_USE_JSON_DB === 'true') {
    return createJsonDbClient() as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
