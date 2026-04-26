import { cn } from '@/lib/utils'

interface WordmarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Wordmark({ className, size = 'md' }: WordmarkProps) {
  const sizes = {
    sm: { mark: 'size-6 text-[11px]', name: 'text-[13px]', sub: 'text-[9px]' },
    md: { mark: 'size-8 text-[14px]', name: 'text-[15px]', sub: 'text-[10px]' },
    lg: { mark: 'size-10 text-[16px]', name: 'text-[18px]', sub: 'text-[11px]' },
  }[size]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          sizes.mark,
          'rounded-xl flex items-center justify-center font-semibold text-primary-foreground tracking-tight shrink-0',
          'bg-gradient-to-br from-primary to-[oklch(0.42_0.12_161)]',
          'ring-1 ring-primary/20 shadow-sm'
        )}
      >
        M
      </div>
      <div>
        <div className={cn(sizes.name, 'font-semibold tracking-tight text-foreground leading-none')}>
          medfin
        </div>
        <div className={cn(sizes.sub, 'text-muted-foreground tracking-widest uppercase mt-0.5 leading-none')}>
          cobranzas
        </div>
      </div>
    </div>
  )
}
