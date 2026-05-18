import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import InstitucionesClient from './InstitucionesClient'

export default async function InstitucionesPage() {
  const supabase = await createClient()
  
  const [{ data: instituciones }, { data: reglas }] = await Promise.all([
    supabase
      .from('instituciones')
      .select('*')
      .order('nombre'),
    supabase
      .from('reglas_plazo')
      .select('*')
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
