import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  eyebrow: string
  value: string | React.ReactNode
  sub?: string
  accent?: 'default' | 'primary' | 'warning' | 'destructive' | 'success'
  className?: string
}

import type React from 'react'

export function StatCard({ eyebrow, value, sub, accent = 'default', className }: StatCardProps) {
  const valueColor = {
    default:     'text-foreground',
    primary:     'text-primary',
    warning:     'text-warning',
    destructive: 'text-destructive',
    success:     'text-success',
  }[accent]

  return (
    <Card className={cn('border-border/60 shadow-none', className)}>
      <CardContent className="p-5">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <div className={cn('text-[2.6rem] leading-none tracking-tight', valueColor)}>
          {value}
        </div>
        {sub && (
          <p className="text-xs text-muted-foreground mt-2">{sub}</p>
        )}
      </CardContent>
    </Card>
  )
}
