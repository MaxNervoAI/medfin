import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-xl bg-slate-200',
            className
          )}
        />
      ))}
    </>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28" count={4} />
      </div>

      {/* Chart skeleton */}
      <Skeleton className="h-64 w-full" />

      {/* Recent list skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 w-full" count={3} />
      </div>
    </div>
  )
}

export function PrestacionesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Filter pills skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-full" count={4} />
      </div>

      {/* List skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" count={6} />
      </div>
    </div>
  )
}

export function InstitucionesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* List skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" count={5} />
      </div>
    </div>
  )
}
