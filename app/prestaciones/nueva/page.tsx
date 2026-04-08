import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import NuevaPrestacionForm from './NuevaPrestacionForm'

export default async function NuevaPrestacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: instituciones }, { data: reglas }] = await Promise.all([
    supabase.from('instituciones').select('id, nombre').eq('user_id', user.id).order('nombre'),
    supabase.from('reglas_plazo').select('*').eq('user_id', user.id),
  ])

  return (
    <AppShell>
      <NuevaPrestacionForm
        instituciones={instituciones ?? []}
        reglas={reglas ?? []}
      />
    </AppShell>
  )
}
