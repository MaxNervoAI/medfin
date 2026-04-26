'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Building2, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/prestaciones',  label: 'Cobranzas',    icon: FileText },
  { href: '/instituciones', label: 'Lugares',      icon: Building2 },
  { href: '/presupuesto',   label: 'Presupuesto',  icon: PieChart },
]

export default function MobileNav() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/90 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 min-h-[44px] min-w-[44px] transition-colors relative"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <Icon
                className={cn(
                  'size-5 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
