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
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  const sidebarVisible = isDesktop || sidebarOpen

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f7fb' }}>

      {/* Overlay móvil */}
      {sidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-30"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {sidebarVisible && (
        <aside
          className="fixed top-0 left-0 h-full flex flex-col z-40 bg-white"
          style={{
            width: 256,
            borderRight: '1px solid #f1f5f9',
            boxShadow: isDesktop ? 'none' : '4px 0 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center px-6 border-b border-slate-100" style={{ height: 64 }}>
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center rounded-lg bg-blue-600" style={{ width: 32, height: 32 }}>
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-blue-700 text-lg tracking-tight">Medfin</span>
            </div>
            {!isDesktop && (
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 ml-2">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3 mb-4">Menú</p>
            <div className="flex flex-col gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative',
                      active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                    )}
                    style={active ? { backgroundColor: '#eff6ff' } : {}}
                  >
                    {active && (
                      <span
                        className="absolute rounded-r-full bg-blue-600"
                        style={{ left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 24 }}
                      />
                    )}
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight size={14} className="opacity-40" />}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Usuario */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
              <div
                className="flex items-center justify-center rounded-full text-white text-xs font-bold shrink-0"
                style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
              >
                {iniciales}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{primerNombre}</p>
                <p className="text-xs text-slate-400">Profesional de salud</p>
              </div>
              <button
                onClick={cerrarSesion}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg"
                title="Cerrar sesión"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── Área principal ── */}
      <div
        className="flex flex-col min-h-screen w-full"
        style={{ marginLeft: isDesktop ? 256 : 0 }}
      >
        {/* Header */}
        <header
          className="flex items-center px-6 bg-white sticky top-0 z-20"
          style={{ height: 64, borderBottom: '1px solid #f1f5f9' }}
        >
          {!isDesktop && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-700 mr-4 p-1"
            >
              <Menu size={22} />
            </button>
          )}
          <h1 className="font-bold text-slate-800 text-base">{pageTitle}</h1>
          <div className="ml-auto">
            <div
              className="flex items-center justify-center rounded-full text-white text-xs font-bold"
              style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
            >
              {iniciales}
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 p-4 pb-24" style={{ paddingBottom: isDesktop ? 32 : 96 }}>
          {children}
        </main>
      </div>

      {/* Bottom nav solo en móvil */}
      {!isDesktop && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white z-20" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div className="flex">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs transition-colors',
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
      )}
    </div>
  )
}
