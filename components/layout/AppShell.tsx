'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Building2, PieChart, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/prestaciones', label: 'Cobranzas', icon: FileText },
  { href: '/instituciones', label: 'Lugares', icon: Building2 },
  { href: '/presupuesto', label: 'Presupuesto', icon: PieChart },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-blue-600 text-lg tracking-tight">Medfin</span>
          <button
            onClick={cerrarSesion}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Navegación inferior (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-40">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors',
                  active
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn('font-medium', active && 'font-semibold')}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
