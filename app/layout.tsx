import type { Metadata, Viewport } from 'next'
import './globals.css'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'

export const metadata: Metadata = {
  title: 'Dr Wallet — Finanzas para profesionales de salud',
  description: 'Controla tus cobranzas, boletas y presupuesto mensual como médico independiente.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dr Wallet',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0E7C66',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dr Wallet" />
        <meta name="msapplication-TileColor" content="#0E7C66" />
      </head>
      <body className="antialiased">
        <QueryProvider>
          <ErrorBoundary>
            {children}
            <Toaster richColors position="top-right" />
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  )
}
