import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import PresupuestoClient from './PresupuestoClient'

export default async function PresupuestoPage() {
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
    .gte('fecha_prestacion', seisMesesAtras.toISOString().split('T')[0])
    .order('fecha_prestacion', { ascending: false })

  return (
    <AppShell>
      <PresupuestoClient prestaciones={prestaciones ?? []} />
    </AppShell>
  )
}
