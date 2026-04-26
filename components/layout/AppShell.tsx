'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, Building2, PieChart,
  LogOut, Menu, Plus, Bell, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wordmark } from '@/components/brand/Wordmark'
import MobileNav from './MobileNav'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/prestaciones',  label: 'Cobranzas',    icon: FileText },
  { href: '/instituciones', label: 'Instituciones', icon: Building2 },
  { href: '/presupuesto',   label: 'Presupuesto',  icon: PieChart },
]

export default function AppShell({ children, nombre }: { children: React.ReactNode; nombre?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const iniciales = nombre
    ? nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'DR'
  const nombreDisplay = nombre?.split(' ').slice(0, 2).join(' ') ?? 'Doctor'

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  const currentNav = navItems.find(({ href }) => isActive(href))
  const pageTitle = currentNav?.label ?? 'Medfin'

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-screen bg-background"
      onKeyDown={(e) => {
        if (
          e.key === 'n' &&
          !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)
        ) {
          e.preventDefault()
          router.push('/prestaciones/nueva')
        }
      }}
    >
      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'bg-card border-r border-border flex flex-col h-screen sticky top-0',
          'transition-transform duration-200',
          sidebarOpen
            ? 'fixed left-0 top-0 w-[260px] z-40 translate-x-0 shadow-2xl md:static md:shadow-none md:translate-x-0'
            : 'hidden md:flex'
        )}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border">
          <Wordmark />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          <p className="eyebrow px-3 pb-2">Navegación</p>

          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'min-h-[44px] transition-colors duration-150',
                isActive(href)
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
              {isActive(href) && (
                <ChevronRight className="size-3.5 ml-auto opacity-60" />
              )}
            </Link>
          ))}

          <Separator className="my-3" />
          <p className="eyebrow px-3 pb-2">Acciones rápidas</p>

          <Link
            href="/prestaciones/nueva"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
              'min-h-[44px] transition-colors duration-150',
              'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Plus className="size-4 shrink-0" />
            <span>Nueva prestación</span>
            <kbd className="ml-auto text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">N</kbd>
          </Link>
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors min-h-[44px] text-left group">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {iniciales}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{nombreDisplay}</p>
                  <p className="text-xs text-muted-foreground">Médico independiente</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={cerrarSesion}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-3.5 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-9"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Abrir menú"
          >
            <Menu className="size-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground hidden sm:block">medfin · cobranzas</p>
            <h2 className="font-serif text-xl tracking-tight text-foreground leading-tight">{pageTitle}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="size-9 relative" aria-label="Notificaciones">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 bg-destructive rounded-full" />
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/prestaciones/nueva">
                <Plus className="size-3.5" />
                Nueva
              </Link>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8 max-w-[1280px] w-full">
          <div className="screen">
            {children}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
