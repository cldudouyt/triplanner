import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'shimmer' | 'none'
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
}: SkeletonProps) {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  }

  const animations = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
    none: '',
  }

  return (
    <div
      className={clsx(
        'bg-gray-200 dark:bg-slate-700',
        variants[variant],
        animations[animation],
        className
      )}
      style={{
        width: width ?? (variant === 'text' ? '100%' : undefined),
        height: height ?? (variant === 'text' ? '1em' : undefined),
      }}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="0.875rem"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border p-6',
        'bg-white dark:bg-slate-800',
        'border-gray-200 dark:border-slate-700',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" height="1.25rem" width="60%" />
          <Skeleton variant="text" height="0.875rem" width="40%" />
        </div>
        <Skeleton variant="rounded" width={48} height={48} />
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border p-6',
        'bg-white dark:bg-slate-800',
        'border-gray-200 dark:border-slate-700',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton variant="text" height="0.875rem" width={80} />
          <Skeleton variant="text" height="2rem" width={60} />
        </div>
        <Skeleton variant="rounded" width={44} height={44} />
      </div>
    </div>
  )
}

export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'flex items-center gap-4 p-3 rounded-xl',
        className
      )}
    >
      <SkeletonAvatar size={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" height="0.875rem" width="70%" />
        <Skeleton variant="text" height="0.75rem" width="50%" />
      </div>
      <Skeleton variant="rounded" width={60} height={24} />
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-xl border',
        'border-gray-200 dark:border-slate-700',
        className
      )}
    >
      {/* Header */}
      <div className="flex bg-gray-50 dark:bg-slate-800 px-4 py-3 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height="0.875rem" className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex px-4 py-3 gap-4 bg-white dark:bg-slate-800">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" height="0.875rem" className="flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" height="1.75rem" width={200} />
        <Skeleton variant="text" height="1rem" width={280} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* List */}
      <div
        className={clsx(
          'rounded-2xl border p-6',
          'bg-white dark:bg-slate-800',
          'border-gray-200 dark:border-slate-700'
        )}
      >
        <Skeleton variant="text" height="1.25rem" width={150} className="mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
