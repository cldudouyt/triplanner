import { type ReactNode } from 'react'
import clsx from 'clsx'

type SportVariant = 'swim' | 'bike' | 'run' | 'strength' | 'rest'
type StatusVariant = 'planned' | 'completed' | 'cancelled' | 'registered' | 'dns'
type PriorityVariant = 'priority-A' | 'priority-B' | 'priority-C'
type GenericVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
type BadgeVariant = GenericVariant | SportVariant | StatusVariant | PriorityVariant

type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  /** Affiche une pastille colorée avant le texte */
  dot?: boolean
  /** Anime la pastille (pulse) */
  pulse?: boolean
}

const variants: Record<BadgeVariant, string> = {
  // Génériques
  default: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
  primary: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  // Sport (Design System v2 — palette confirmée)
  swim: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  bike: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  run: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  strength: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  rest: 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400',
  // Statut compétition
  planned: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  registered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  dns: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400',
  // Priorité compétition
  'priority-A': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'priority-B': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'priority-C': 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  primary: 'bg-orange-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-cyan-500',
  swim: 'bg-cyan-500',
  bike: 'bg-emerald-500',
  run: 'bg-orange-500',
  strength: 'bg-slate-400',
  rest: 'bg-gray-300',
  planned: 'bg-amber-400',
  completed: 'bg-slate-400',
  cancelled: 'bg-red-400',
  registered: 'bg-emerald-400',
  dns: 'bg-gray-400',
  'priority-A': 'bg-red-500',
  'priority-B': 'bg-orange-500',
  'priority-C': 'bg-slate-400',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

/**
 * Badge — étiquette colorée pour statuts, sports, priorités.
 *
 * @example
 * <Badge variant="swim" dot>Natation</Badge>
 * <Badge variant="registered" dot pulse>Inscrit</Badge>
 * <Badge variant="priority-A">A</Badge>
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className,
}: BadgeProps) {
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
            'w-1.5 h-1.5 rounded-full flex-none',
            dotColors[variant],
            pulse && 'animate-dot'
          )}
        />
      )}
      {children}
    </span>
  )
}
