import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Use the canonical app URL to avoid Vercel redirecting to a deployment-specific URL.
  // x-forwarded-host reflects the alias hostname (medfin-henna.vercel.app), not the internal deployment URL.
  const host = request.headers.get('x-forwarded-host') ?? new URL(request.url).host
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${appUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${appUrl}/login?error=auth`)
}
