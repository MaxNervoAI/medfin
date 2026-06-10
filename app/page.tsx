import type { Metadata } from 'next'
import ScrollProgress from '@/components/landing/ScrollProgress'
import Header from '@/components/landing/Header'
import Hero from '@/components/landing/Hero'
import ProblemCards from '@/components/landing/ProblemCards'
import MissionVision from '@/components/landing/MissionVision'
import HowItWorks from '@/components/landing/HowItWorks'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'Dr. Wallet — Finanzas para profesionales independientes en Chile',
  description: 'Deja de perder honorarios por boletas olvidadas. Dr. Wallet captura el 100% de tus prestaciones, calcula retenciones automáticamente y te alerta antes de cada vencimiento.',
  openGraph: {
    title: 'Dr. Wallet — Finanzas para profesionales independientes en Chile',
    description: 'Deja de perder honorarios por boletas olvidadas. Captura el 100% de tus prestaciones, calcula retenciones automáticamente.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <>
      <ScrollProgress />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[300] rounded bg-primary px-4 py-2 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Saltar al contenido principal
      </a>
      <Header />
      <main id="main-content" className="min-h-screen">
        <Hero />
        <ProblemCards />
        <div className="h-px bg-border" aria-hidden="true" />
        <MissionVision />
        <HowItWorks />
        <FinalCTA />
        <Footer />
      </main>
    </>
  )
}
