import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'Dr Wallet — Finanzas para médicos y psicólogos chilenos',
  description: 'Deja de perder $150K-500K CLP cada vez que olvides una boleta. Captura el 100% de tus honorarios, calcula retenciones automáticamente, y recupera tu tiempo.',
  openGraph: {
    title: 'Dr Wallet — Finanzas para médicos y psicólogos chilenos',
    description: 'Deja de perder $150K-500K CLP cada vez que olvides una boleta. Captura el 100% de tus honorarios, calcula retenciones automáticamente.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 rounded bg-primary px-4 py-2 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Saltar al contenido principal
      </a>
      <div id="main-content" className="mt-16">
        <Hero />
        <Features />
        <FinalCTA />
        <Footer />
      </div>
    </main>
  )
}
