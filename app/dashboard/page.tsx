import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import DashboardClient from './DashboardClient'
import fs from 'fs'
import path from 'path'

export default async function DashboardPage({ searchParams }: { searchParams: { debug?: string } }) {
  const isDebug = searchParams.debug === 'true' && process.env.NODE_ENV === 'development'

  if (isDebug) {
    // Debug mode: use mock data
    const mockPrestacionesPath = path.join(process.cwd(), 'app/dashboard/mock-prestaciones.json')
    const mockInstitucionesPath = path.join(process.cwd(), 'app/dashboard/mock-instituciones.json')
    const mockReglasPath = path.join(process.cwd(), 'app/dashboard/mock-reglas.json')
    
    const mockPrestaciones = JSON.parse(fs.readFileSync(mockPrestacionesPath, 'utf-8'))
    const mockInstituciones = JSON.parse(fs.readFileSync(mockInstitucionesPath, 'utf-8'))
    const mockReglas = JSON.parse(fs.readFileSync(mockReglasPath, 'utf-8'))
    
    return (
      <AppShell nombre="Debug User">
        <DashboardClient
          nombre="Debug User"
          prestaciones={mockPrestaciones as any}
          instituciones={mockInstituciones as any}
          reglas={mockReglas as any}
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

  // Prestaciones activas (no pagadas) + pagadas de los últimos 3 meses para el gráfico
  const tresMesesAtras = new Date()
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3)
  const tresMesesAtrasStr = tresMesesAtras.toISOString().split('T')[0]

  const { data: prestaciones } = await supabase
    .from('prestaciones')
    .select('*')
    .eq('user_id', user.id)
    .or(`estado.neq.pagada,and(estado.eq.pagada,fecha_pago_recibido.gte.${tresMesesAtrasStr})`)
    .order('fecha_prestacion', { ascending: false })
  
  console.log('Dashboard fetched prestaciones:', prestaciones?.length, tresMesesAtrasStr)

  // Fetch instituciones and reglas for the new prestacion form
  const { data: instituciones } = await supabase
    .from('instituciones')
    .select('id, nombre')
    .eq('user_id', user.id)
    .eq('activa', true)
    .order('nombre')

  const { data: reglas } = await supabase
    .from('reglas_plazo')
    .select('*')
    .eq('user_id', user.id)

  const nombre = profile?.nombre ?? user.email ?? 'Doctor'

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
