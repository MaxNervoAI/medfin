import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import PrestacionesClient from './PrestacionesClient'

export default async function PrestacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prestaciones } = await supabase
    .from('prestaciones')
    .select('*')
    .order('fecha_prestacion', { ascending: false })
    .limit(100)

  return (
    <AppShell>
      <PrestacionesClient prestaciones={prestaciones ?? []} />
    </AppShell>
  )
}
