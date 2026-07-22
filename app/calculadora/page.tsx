import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { createPublicClient } from '@/lib/supabase/server'
import { getTaxRate } from '@/lib/utils'
import CalculadoraClient from './CalculadoraClient'

// La tasa cambia a lo sumo una vez al año; una hora de caché sobra.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Calculadora de Boleta de Honorarios — Dr Wallet',
  description:
    'Calcula gratis cuánto te descuentan por retención en tu boleta de honorarios y cuánto recibes líquido. Tasa vigente del SII, sin registrarte.',
  openGraph: {
    title: 'Calculadora de Boleta de Honorarios — Dr Wallet',
    description:
      'Bruto, retención y líquido de tu boleta de honorarios con la tasa vigente. Gratis y sin registro.',
    type: 'website',
  },
}

export default async function CalculadoraPage() {
  const supabase = createPublicClient()
  const taxRate = supabase
    ? await getTaxRate(supabase)
    : parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TAX_RATE ?? '0.145')

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <CalculadoraClient taxRate={taxRate} />
      </main>
      <Footer />
    </>
  )
}
