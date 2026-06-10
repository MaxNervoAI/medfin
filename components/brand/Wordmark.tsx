import { cn } from '@/lib/utils'

interface WordmarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Wordmark({ className, size = 'md' }: WordmarkProps) {
  const logoHeight = { sm: 'h-5', md: 'h-6', lg: 'h-8' }[size]
  const subSize = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-[11px]' }[size]

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <img
        src="/logo.png"
        alt="Dr Wallet"
        className={cn(logoHeight, 'w-auto object-contain object-left')}
      />
      <div className={cn(subSize, 'text-muted-foreground tracking-widest uppercase leading-none')}>
        cobranzas
      </div>
    </div>
  )
}
