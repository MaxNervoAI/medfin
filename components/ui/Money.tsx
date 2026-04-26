import { cn } from '@/lib/utils'
import { formatMonto } from '@/lib/utils'

interface MoneyProps {
  value: number
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showSign?: boolean
  muted?: boolean
}

export function Money({ value, className, size = 'md', showSign = false, muted = false }: MoneyProps) {
  const isPositive = value >= 0
  const sizes = {
    sm:  'text-sm',
    md:  'text-base',
    lg:  'text-lg',
    xl:  'text-2xl',
    '2xl': 'text-4xl',
  }[size]

  const colorClass = muted
    ? 'text-muted-foreground'
    : showSign
      ? isPositive ? 'text-success' : 'text-destructive'
      : 'text-foreground'

  return (
    <span
      className={cn(
        'font-mono tabular-nums tracking-tight font-semibold',
        sizes,
        colorClass,
        className
      )}
    >
      {showSign && value > 0 ? '+' : ''}{formatMonto(value)}
    </span>
  )
}
