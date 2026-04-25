'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Building2, PieChart } from 'lucide-react'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/prestaciones',  label: 'Cobranzas',   icon: FileText },
  { href: '/instituciones', label: 'Lugares',     icon: Building2 },
  { href: '/presupuesto',   label: 'Presupuesto', icon: PieChart },
]

export default function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--line)] z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 min-h-[44px] min-w-[44px] transition-colors ${
              isActive(href)
                ? 'text-[var(--accent)]'
                : 'text-[var(--ink-3)]'
            }`}
          >
            <Icon size={20} />
            <span className="text-[11px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
