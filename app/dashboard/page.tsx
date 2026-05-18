import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import DashboardClient from './DashboardClient'

export default async function DashboardPage({ searchParams }: { searchParams: { debug?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch user profile for name
  let nombre = 'Guest User'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', user.id)
      .single()
    
    nombre = profile?.nombre || user.email?.split('@')[0] || 'Guest User'
  }

  // Prestaciones activas (no pagadas) + pagadas de los últimos 3 meses para el gráfico
  const tresMesesAtras = new Date()
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3)
  const tresMesesAtrasStr = tresMesesAtras.toISOString().split('T')[0]

  const { data: prestaciones } = await supabase
    .from('prestaciones')
    .select('*')
    .or(`estado.neq.pagada,and(estado.eq.pagada,fecha_pago_recibido.gte.${tresMesesAtrasStr})`)
    .order('fecha_prestacion', { ascending: false })

  // Fetch instituciones and reglas for the new prestacion form
  const { data: instituciones } = await supabase
    .from('instituciones')
    .select('id, nombre')
    .eq('activa', true)
    .order('nombre')

  const { data: reglas } = await supabase
    .from('reglas_plazo')
    .select('*')

  return (
    <AppShell nombre={nombre}>
      <DashboardClient
        nombre={nombre}
        prestaciones={prestaciones ?? []}
        instituciones={instituciones ?? []}
        reglas={reglas ?? []}
      />
    </AppShell>
  )
}
