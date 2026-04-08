import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
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
    .or(`estado.neq.pagada,and(estado.eq.pagada,fecha_pago_recibido.gte.${inicioMesStr})`)
    .order('fecha_prestacion', { ascending: false })

  return (
    <AppShell>
      <DashboardClient
        nombre={profile?.nombre ?? user.email ?? 'Doctor'}
        prestaciones={prestaciones ?? []}
      />
    </AppShell>
  )
}
