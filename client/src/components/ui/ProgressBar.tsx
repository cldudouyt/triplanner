import clsx from 'clsx'

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const colorClasses = {
  blue: 'bg-blue-500 dark:bg-blue-400',
  green: 'bg-emerald-600 dark:bg-emerald-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
  purple: 'bg-purple-500 dark:bg-purple-400',
  red: 'bg-red-500 dark:bg-red-400',
  cyan: 'bg-cyan-600 dark:bg-cyan-400',
  gradient: 'bg-gradient-to-r from-orange-400 to-orange-600',
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  value,
  max = 100,
  color = 'gradient',
  size = 'md',
  showLabel = false,
  animated = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Progression</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={clsx(
          'w-full rounded-full overflow-hidden',
          'bg-gray-200 dark:bg-slate-700',
          sizeClasses[size]
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            colorClasses[color],
            animated && 'animate-progress'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  showLabel?: boolean
  className?: string
}

export function CircularProgress({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  color,
  showLabel = true,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (color) return color
    if (percentage >= 80) return '#22c55e'
    if (percentage >= 60) return '#3b82f6'
    if (percentage >= 40) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className={clsx('relative inline-flex', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-gray-200 dark:stroke-slate-700"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {Math.round(percentage)}
          </span>
        </div>
      )}
    </div>
  )
}
