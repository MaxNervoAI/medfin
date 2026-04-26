import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import PresupuestoClient from './PresupuestoClient'

export default async function PresupuestoPage({ searchParams }: { searchParams: { debug?: string } }) {
  const isDebug = searchParams.debug === 'true' && process.env.NODE_ENV === 'development'

  if (isDebug) {
    return (
      <AppShell nombre="Debug User">
        <PresupuestoClient prestaciones={[]} />
      </AppShell>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Últimos 6 meses de prestaciones
  const seisMesesAtras = new Date()
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5)
  seisMesesAtras.setDate(1)

  const { data: prestaciones } = await supabase
    .from('prestaciones')
    .select('*')
    .eq('user_id', user.id)
    .gte('fecha_prestacion', seisMesesAtras.toISOString().split('T')[0])
    .order('fecha_prestacion', { ascending: false })

  return (
    <AppShell>
      <PresupuestoClient prestaciones={prestaciones ?? []} />
    </AppShell>
  )
}
