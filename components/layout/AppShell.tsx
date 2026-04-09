'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Building2, PieChart, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/prestaciones',  label: 'Cobranzas',   icon: FileText },
  { href: '/instituciones', label: 'Lugares',     icon: Building2 },
  { href: '/presupuesto',   label: 'Presupuesto', icon: PieChart },
]

const pageTitles: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/prestaciones':  'Cobranzas',
  '/instituciones': 'Lugares de trabajo',
  '/presupuesto':   'Presupuesto',
}

export default function AppShell({ children, nombre }: { children: React.ReactNode; nombre?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const pageTitle = Object.entries(pageTitles).find(([key]) =>
    pathname === key || (key !== '/dashboard' && pathname.startsWith(key))
  )?.[1] ?? 'Medfin'

  const iniciales = nombre
    ? nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'DR'
  const primerNombre = nombre?.split(' ')[0] ?? 'Doctor'

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white flex flex-col z-40 transition-transform duration-300',
        'lg:translate-x-0 lg:border-r lg:border-slate-100',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}>

        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-blue-700 text-lg tracking-tight">Medfin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-3">Menú</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative',
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r-full" />
                )}
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="opacity-40" />}
              </Link>
            )
          })}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {iniciales}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{primerNombre}</p>
              <p className="text-xs text-slate-400">Profesional de salud</p>
            </div>
            <button
              onClick={cerrarSesion}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
              title="Cerrar sesión"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Área principal ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 sticky top-0 z-20 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700 mr-4 p-1"
          >
            <Menu size={22} />
          </button>
          <h1 className="font-bold text-slate-800 text-base">{pageTitle}</h1>
          <div className="ml-auto">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {iniciales}
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom nav (solo móvil) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-20">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[11px] transition-colors',
                  active ? 'text-blue-600' : 'text-slate-400'
                )}
              >
                <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn(active && 'font-semibold')}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
