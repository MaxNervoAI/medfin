'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Building2, PieChart, LogOut, Menu, X, Search, Bell, Sliders, Sprout, Plus, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

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
  const primerNombre = nombre?.split(' ')[0] ?? 'Doctor'
  const primerApellido = nombre?.split(' ')[1] ?? 'Rueda'

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <div
      className="app"
      style={{
        display: 'grid',
        gridTemplateColumns: '248px 1fr',
        minHeight: '100vh',
      }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault()
        }
        if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as any)?.tagName)) {
          e.preventDefault()
          router.push('/prestaciones/nueva')
        }
      }}
    >
      {/* Sidebar */}
      <aside className="sidebar" style={{
        borderRight: '1px solid var(--line)',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Brand */}
        <div className="brand" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '22px 22px 18px',
          borderBottom: '1px solid var(--line)',
        }}>
          <div className="brand-mark" style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, oklch(0.42 0.12 155), oklch(0.28 0.08 155))',
            color: 'white',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '-0.02em',
            position: 'relative',
          }}>
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
            <div className="brand-name" style={{
              fontWeight: 600,
              fontSize: '15px',
              letterSpacing: '-0.02em',
            }}>
              Medfin<span className="brand-dot" style={{
                color: 'var(--ink-4)',
                marginLeft: '4px',
                fontSize: '12px',
              }}>·cl</span>
            </div>
            <div style={{
              fontSize: '10.5px',
              color: 'var(--ink-3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>Cobranzas médicas</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          flex: 1,
          overflow: 'auto',
        }}>
          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--ink-4)',
            padding: '14px 12px 8px',
            fontWeight: 600,
          }}>Menú</div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className="nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                color: isActive(href) ? '#fff' : 'var(--ink-2)',
                fontSize: '13.5px',
                fontWeight: 500,
                transition: 'background 0.15s, color 0.15s',
                background: isActive(href) ? 'var(--ink)' : 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive(href)) {
                  (e.target as HTMLElement).style.background = 'var(--accent-weak)';
                  (e.target as HTMLElement).style.color = 'var(--ink)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(href)) {
                  (e.target as HTMLElement).style.background = 'transparent';
                  (e.target as HTMLElement).style.color = 'var(--ink-2)';
                }
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span>{label}</span>
            </Link>
          ))}

          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--ink-4)',
            padding: '14px 12px 8px',
            fontWeight: 600,
            marginTop: '8px',
          }}>Alianzas</div>
          {alianzasItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                color: isActive(href) ? '#fff' : 'var(--ink-2)',
                fontSize: '13.5px',
                fontWeight: 500,
                transition: 'background 0.15s, color 0.15s',
                background: isActive(href) ? 'var(--ink)' : 'transparent',
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span>{label}</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '11px',
                color: isActive(href) ? 'rgba(255,255,255,0.85)' : 'var(--accent-strong)',
                background: isActive(href) ? 'rgba(255,255,255,0.14)' : 'var(--accent-soft)',
                padding: '1px 7px',
                borderRadius: '999px',
                fontVariantNumeric: 'tabular-nums',
              }}>Nuevo</span>
            </Link>
          ))}

          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--ink-4)',
            padding: '14px 12px 8px',
            fontWeight: 600,
            marginTop: '8px',
          }}>Acciones rápidas</div>
          <Link
            href="/prestaciones/nueva"
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '10px',
              color: 'var(--ink-2)',
              fontSize: '13.5px',
              fontWeight: 500,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <Plus size={16} style={{ flexShrink: 0 }} />
            <span>Nueva prestación</span>
            <span className="kbd" style={{ marginLeft: 'auto' }}>N</span>
          </Link>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '10px',
              color: 'var(--ink-2)',
              fontSize: '13.5px',
              fontWeight: 500,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <Download size={16} style={{ flexShrink: 0 }} />
            <span>Exportar a SII</span>
          </button>
        </nav>

        {/* User card */}
        <div style={{
          margin: '12px',
          padding: '12px',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--ink)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 600,
            fontSize: '12px',
            letterSpacing: '-0.02em',
          }}>
            {iniciales}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}>Dra. {primerApellido}</div>
            <div style={{
              fontSize: '11px',
              color: 'var(--ink-3)',
            }}>Cirujana general</div>
          </div>
          <button
            onClick={cerrarSesion}
            style={{
              color: 'var(--ink-3)',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {/* Topbar */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px 32px',
          borderBottom: '1px solid var(--line)',
          background: 'color-mix(in oklab, var(--bg), white 40%)',
          backdropFilter: 'saturate(140%) blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none' }}
            className="md:hidden"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <div style={{
              fontSize: '12px',
              color: 'var(--ink-3)',
            }}>{pageConfig.crumb}</div>
            <div className="serif" style={{
              fontSize: '22px',
              letterSpacing: '-0.01em',
            }}>{pageConfig.title}</div>
          </div>
          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid var(--line-2)',
              borderRadius: '10px',
              padding: '7px 10px',
              background: 'var(--surface)',
              minWidth: '240px',
              color: 'var(--ink-3)',
              fontSize: '13px',
            }}>
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar prestación, institución…"
                style={{
                  border: 0,
                  outline: 0,
                  flex: 1,
                  background: 'transparent',
                  color: 'var(--ink)',
                }}
              />
              <span className="kbd">⌘K</span>
            </div>
            <button className="btn btn-ghost" title="Notificaciones" style={{ position: 'relative' }}>
              <Bell size={14} />
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '8px',
                width: '6px',
                height: '6px',
                background: 'var(--red)',
                borderRadius: '50%',
              }} />
            </button>
            <button className="btn btn-ghost" title="Tweaks">
              <Sliders size={14} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{
          padding: '28px 32px 64px',
          maxWidth: '1280px',
          width: '100%',
          flex: 1,
        }}>
          <div className="screen">
            {children}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 900px) {
          .app {
            grid-template-columns: 1fr;
          }
          .sidebar {
            display: none;
            position: fixed;
            left: 0;
            top: 0;
            width: 248px;
            z-index: 40;
            box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          }
          .sidebar.show {
            display: flex;
          }
        }
      `}</style>
    </div>
  )
}
