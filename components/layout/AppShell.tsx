'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Building2, PieChart, LogOut, Menu, X, Search, Bell, Sliders, Sprout, Plus, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import MobileNav from './MobileNav'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/prestaciones',  label: 'Cobranzas',   icon: FileText },
  { href: '/instituciones', label: 'Lugares',     icon: Building2 },
  { href: '/presupuesto',   label: 'Presupuesto', icon: PieChart },
]

const alianzasItems = [
  { href: '/alianzas', label: 'Inversiones', icon: Sprout },
]

const pageTitles: Record<string, { title: string; crumb: string }> = {
  '/dashboard':     { title: 'Dashboard', crumb: 'Medfin · Abril 2026' },
  '/prestaciones':  { title: 'Cobranzas', crumb: 'Medfin · Lista y detalle' },
  '/instituciones': { title: 'Lugares de trabajo', crumb: 'Medfin · Instituciones' },
  '/presupuesto':   { title: 'Presupuesto', crumb: 'Medfin · Proyección' },
}

export default function AppShell({ children, nombre }: { children: React.ReactNode; nombre?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pageConfig = Object.entries(pageTitles).find(([key]) =>
    pathname === key || (key !== '/dashboard' && pathname.startsWith(key))
  )?.[1] ?? { title: 'Medfin', crumb: 'Medfin · App' }

  const iniciales = nombre
    ? nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'DR'
  const primerApellido = nombre?.split(' ')[1] ?? 'Rueda'

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <div
      className="app grid grid-cols-1 md:grid-cols-[248px_1fr] min-h-screen"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault()
        }
        if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) {
          e.preventDefault()
          router.push('/prestaciones/nueva')
        }
      }}
    >
      {/* Sidebar */}
      <aside className={`sidebar border-r border-[var(--line)] bg-[var(--surface)] flex flex-col sticky top-0 h-screen ${sidebarOpen ? 'fixed left-0 top-0 w-[248px] z-40 shadow-xl md:static md:shadow-none md:w-auto' : 'hidden md:flex'}`}>
        {/* Brand */}
        <div className="brand flex items-center gap-2.5 px-5.5 py-5.5 border-b border-[var(--line)]">
          <div className="brand-mark w-7 h-7 rounded-lg bg-gradient-to-br from-[oklch(0.42_0.12_155)] to-[oklch(0.28_0.08_155)] text-white grid place-items-center font-semibold text-[13px] tracking-[-0.02em] relative">
            M
            <style>{`
              .brand-mark::after {
                content: '';
                position: absolute;
                inset: 6px;
                border: 1.5px solid rgba(255,255,255,0.55);
                border-radius: 4px;
                border-right-color: transparent;
                border-bottom-color: transparent;
                transform: rotate(45deg);
              }
            `}</style>
          </div>
          <div>
            <div className="brand-name font-semibold text-[15px] tracking-[-0.02em]">
              Medfin<span className="brand-dot text-[var(--ink-4)] ml-1 text-[12px]">·cl</span>
            </div>
            <div className="text-[10.5px] text-[var(--ink-3)] tracking-[0.08em] uppercase">Cobranzas médicas</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-3.5 flex flex-col gap-0.5 flex-1 overflow-auto">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-4)] px-3 py-3.5 pb-2 font-semibold">Menú</div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item flex items-center gap-2.5 px-3 py-3 rounded-xl text-[13.5px] font-medium transition-all duration-150 cursor-pointer min-h-[44px] ${
                isActive(href)
                  ? 'bg-[var(--ink)] text-white'
                  : 'text-[var(--ink-2)] hover:bg-[var(--accent-weak)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{label}</span>
            </Link>
          ))}

          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-4)] px-3 py-3.5 pb-2 font-semibold mt-2">Alianzas</div>
          {alianzasItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-[13.5px] font-medium transition-all duration-150 min-h-[44px] ${
                isActive(href)
                  ? 'bg-[var(--ink)] text-white'
                  : 'text-[var(--ink-2)]'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{label}</span>
              <span className={`ml-auto text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
                isActive(href)
                  ? 'text-white/85 bg-white/14'
                  : 'text-[var(--accent-strong)] bg-[var(--accent-soft)]'
              }`}>Nuevo</span>
            </Link>
          ))}

          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-4)] px-3 py-3.5 pb-2 font-semibold mt-2">Acciones rápidas</div>
          <Link
            href="/prestaciones/nueva"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-[var(--ink-2)] text-[13.5px] font-medium transition-all duration-150 hover:bg-[var(--accent-weak)] hover:text-[var(--ink)] min-h-[44px]"
          >
            <Plus size={16} className="flex-shrink-0" />
            <span>Nueva prestación</span>
            <span className="kbd ml-auto">N</span>
          </Link>
          <button className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-[var(--ink-2)] text-[13.5px] font-medium transition-all duration-150 hover:bg-[var(--accent-weak)] hover:text-[var(--ink)] min-h-[44px]">
            <Download size={16} className="flex-shrink-0" />
            <span>Exportar a SII</span>
          </button>
        </nav>

        {/* User card */}
        <div className="m-3 p-3 border border-[var(--line)] rounded-xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-white grid place-items-center font-semibold text-[12px] tracking-[-0.02em]">
            {iniciales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold tracking-[-0.01em]">Dra. {primerApellido}</div>
            <div className="text-[11px] text-[var(--ink-3)]">Cirujana general</div>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-[var(--ink-3)] p-1 rounded-lg cursor-pointer hover:bg-[var(--bg)] transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-3.5 px-8 py-4 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg),white_40%)] backdrop-blur saturate-[140%] sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex md:hidden"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <div className="text-[12px] text-[var(--ink-3)]">{pageConfig.crumb}</div>
            <div className="serif text-[22px] tracking-[-0.01em]">{pageConfig.title}</div>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="flex items-center gap-2 border border-[var(--line-2)] rounded-xl px-2.5 py-1.5 bg-[var(--surface)] min-w-[240px] text-[var(--ink-3)] text-[13px]">
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar prestación, institución…"
                className="border-0 outline-0 flex-1 bg-transparent text-[var(--ink)]"
              />
              <span className="kbd">⌘K</span>
            </div>
            <button className="btn btn-ghost relative" title="Notificaciones">
              <Bell size={14} />
              <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-[var(--red)] rounded-full" />
            </button>
            <button className="btn btn-ghost" title="Tweaks">
              <Sliders size={14} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="px-8 py-7 pb-16 md:pb-16 max-w-[1280px] w-full flex-1">
          <div className="screen">
            {children}
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
