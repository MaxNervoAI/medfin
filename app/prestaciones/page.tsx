import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import PrestacionesClient from './PrestacionesClient'

export default async function PrestacionesPage() {
  const supabase = await createClient()
  
  const [{ data: prestaciones }, { data: instituciones }, { data: reglas }] = await Promise.all([
    supabase.from('prestaciones').select('*, files:prestaciones_files(*)').order('fecha_prestacion', { ascending: false }).limit(100),
    supabase.from('instituciones').select('id, nombre, directorio_id').eq('activa', true).order('nombre'),
    supabase.from('reglas_plazo').select('*'),
  ])

  return (
    <AppShell>
      <PrestacionesClient
        prestaciones={prestaciones ?? []}
        instituciones={instituciones ?? []}
        reglas={reglas ?? []}
      />
    </AppShell>
  )
}
