import { type ReactNode } from 'react'
import clsx from 'clsx'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'swim' | 'bike' | 'run' | 'strength' | 'rest'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  dot?: boolean
  pulse?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  info: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  swim: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  bike: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  run: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  strength: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  rest: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-cyan-500',
  swim: 'bg-cyan-500',
  bike: 'bg-green-500',
  run: 'bg-orange-500',
  strength: 'bg-purple-500',
  rest: 'bg-slate-400',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({ children, variant = 'default', size = 'md', dot = false, pulse = false, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            dotColors[variant],
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  )
}
