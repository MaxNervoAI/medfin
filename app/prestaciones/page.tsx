import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import PrestacionesClient from './PrestacionesClient'

export default async function PrestacionesPage({ searchParams }: { searchParams: { debug?: string } }) {
  const isDebug = searchParams.debug === 'true' && process.env.NODE_ENV === 'development'

  if (isDebug) {
    return (
      <AppShell nombre="Debug User">
        <PrestacionesClient prestaciones={[]} instituciones={[]} reglas={[]} />
      </AppShell>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: prestaciones }, { data: instituciones }, { data: reglas }] = await Promise.all([
    supabase.from('prestaciones').select('*').eq('user_id', user.id).order('fecha_prestacion', { ascending: false }).limit(100),
    supabase.from('instituciones').select('id, nombre').eq('user_id', user.id).eq('activa', true).order('nombre'),
    supabase.from('reglas_plazo').select('*').eq('user_id', user.id),
  ])

  return (
    <AppShell>
      <PrestacionesClient
        prestaciones={prestaciones ?? []}
        instituciones={instituciones ?? []}
        reglas={reglas ?? []}
      />
    </AppShell>
  )
}
