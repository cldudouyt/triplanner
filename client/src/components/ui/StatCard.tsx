import { type ReactNode } from 'react'
import clsx from 'clsx'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: number
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan'
  className?: string
  animate?: boolean
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500',
    light: 'bg-blue-50 dark:bg-blue-900/20',
    shadow: 'shadow-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-500',
    light: 'bg-green-50 dark:bg-green-900/20',
    shadow: 'shadow-green-500/30',
    text: 'text-green-600 dark:text-green-400',
  },
  orange: {
    bg: 'bg-orange-500',
    light: 'bg-orange-50 dark:bg-orange-900/20',
    shadow: 'shadow-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
  },
  purple: {
    bg: 'bg-purple-500',
    light: 'bg-purple-50 dark:bg-purple-900/20',
    shadow: 'shadow-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
  },
  red: {
    bg: 'bg-red-500',
    light: 'bg-red-50 dark:bg-red-900/20',
    shadow: 'shadow-red-500/30',
    text: 'text-red-600 dark:text-red-400',
  },
  cyan: {
    bg: 'bg-cyan-500',
    light: 'bg-cyan-50 dark:bg-cyan-900/20',
    shadow: 'shadow-cyan-500/30',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue', className, animate = false }: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl border p-6',
        'bg-white dark:bg-slate-800',
        'border-gray-200 dark:border-slate-700',
        'transition-all duration-300 hover:shadow-lg',
        'hover:shadow-gray-200/50 dark:hover:shadow-slate-900/50',
        animate && 'animate-fade-in-up',
        className
      )}
    >
      {/* Background decoration */}
      <div className={clsx('absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 dark:opacity-20', colors.bg)} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
          {typeof trend === 'number' && (
            <div className={clsx('mt-2 flex items-center gap-1 text-sm font-medium', trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-xl shadow-lg', colors.bg, colors.shadow)}>
            <div className="text-white">{icon}</div>
          </div>
        )}
      </div>
    </div>
  )
}
