import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import PerfilClient from './PerfilClient'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No autenticado</p>
      </div>
    )
  }

  // Fetch user profile for name
  let nombre = 'Guest User'
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  nombre = profile?.nombre || user.email?.split('@')[0] || 'Guest User'

  // Fetch specialties
  const { data: especialidades, error: especialidadesError } = await supabase
    .from('perfil_especialidades')
    .select('especialidad_id, especialidades (nombre, tipo)')
    .eq('perfil_id', user.id)

  return (
    <AppShell nombre={nombre}>
      <PerfilClient
        profile={profile}
        especialidades={especialidades?.map(e => e.especialidades) || []}
      />
    </AppShell>
  )
}
