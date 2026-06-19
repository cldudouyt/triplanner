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
    light: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    light: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  orange: {
    light: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
  },
  purple: {
    light: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
  red: {
    light: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
  cyan: {
    light: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue', className, animate = false }: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <div
      className={clsx(
        'rounded-[18px] border p-[18px]',
        'bg-white dark:bg-slate-800',
        'border-gray-200 dark:border-slate-700',
        'shadow-[0_8px_24px_-18px_rgba(17,24,39,.2)] dark:shadow-none',
        'transition-all duration-300',
        animate && 'animate-fade-in-up',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {icon && (
          <div className={clsx('w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-none', colors.light)}>
            <div className={colors.text}>{icon}</div>
          </div>
        )}
        {typeof trend === 'number' && (
          <div className={clsx('flex items-center gap-0.5 text-xs font-bold', trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[25px] font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{value}</span>
        {subtitle && <span className="text-[12.5px] font-semibold text-gray-400 dark:text-gray-500">{subtitle}</span>}
      </div>
    </div>
  )
}
