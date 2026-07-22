import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { createPublicClient } from '@/lib/supabase/server'
import DirectorioClient from './DirectorioClient'

// El catálogo cambia poco; refrescar el conteo cada hora basta.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Directorio de Clínicas y Hospitales de Chile — Dr Wallet',
  description:
    'Busca gratis entre los hospitales, clínicas y centros médicos vigentes del registro oficial DEIS/MINSAL. Encuentra dónde trabajas y lleva el control de tus boletas.',
  openGraph: {
    title: 'Directorio de Clínicas y Hospitales de Chile — Dr Wallet',
    description:
      'Hospitales, clínicas y centros médicos del registro oficial DEIS/MINSAL, en un buscador simple y gratuito.',
    type: 'website',
  },
}

export default async function DirectorioPage() {
  const supabase = createPublicClient()

  let total = 0
  if (supabase) {
    // RLS (rol anon) ya limita a filas verificadas; el conteo coincide con
    // lo que el buscador puede devolver.
    const { count } = await supabase
      .from('instituciones_directorio')
      .select('id', { count: 'exact', head: true })
    total = count ?? 0
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <DirectorioClient total={total} />
      </main>
      <Footer />
    </>
  )
}
