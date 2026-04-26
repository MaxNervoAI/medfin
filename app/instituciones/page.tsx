import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import InstitucionesClient from './InstitucionesClient'

export default async function InstitucionesPage({ searchParams }: { searchParams: { debug?: string } }) {
  const isDebug = searchParams.debug === 'true' && process.env.NODE_ENV === 'development'

  if (isDebug) {
    return (
      <AppShell nombre="Debug User">
        <InstitucionesClient instituciones={[]} reglas={[]} />
      </AppShell>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: instituciones }, { data: reglas }] = await Promise.all([
    supabase
      .from('instituciones')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre'),
    supabase
      .from('reglas_plazo')
      .select('*')
      .eq('user_id', user.id)
      .order('tipo_prestacion_nombre'),
  ])

  return (
    <AppShell>
      <InstitucionesClient
        instituciones={instituciones ?? []}
        reglas={reglas ?? []}
      />
    </AppShell>
  )
}
