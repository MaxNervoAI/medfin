import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import DashboardClient from './DashboardClient'

export default async function DashboardPage({ searchParams }: { searchParams: { debug?: string } }) {
  const isDebug = searchParams.debug === 'true' && process.env.NODE_ENV === 'development'

  if (isDebug) {
    // Debug mode: use mock data
    return (
      <AppShell nombre="Debug User">
        <DashboardClient
          nombre="Debug User"
          prestaciones={[]}
        />
      </AppShell>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', user.id)
    .single()

  // Prestaciones activas (no pagadas) + pagadas del mes actual
  const inicioMes = new Date()
  inicioMes.setDate(1)
  const inicioMesStr = inicioMes.toISOString().split('T')[0]

  const { data: prestaciones } = await supabase
    .from('prestaciones')
    .select('*')
    .eq('user_id', user.id)
    .or(`estado.neq.pagada,and(estado.eq.pagada,fecha_pago_recibido.gte.${inicioMesStr})`)
    .order('fecha_prestacion', { ascending: false })

  const nombre = profile?.nombre ?? user.email ?? 'Doctor'

  return (
    <AppShell nombre={nombre}>
      <DashboardClient
        nombre={nombre}
        prestaciones={prestaciones ?? []}
      />
    </AppShell>
  )
}
