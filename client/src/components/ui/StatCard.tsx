import { type ReactNode } from 'react'
import clsx from 'clsx'

interface StatCardProps {
  /** Label en uppercase */
  title: string
  /** Valeur principale affichée en grand */
  value: string | number
  /** Unité ou complément affiché après la valeur (ex: "TSS/j", "km") */
  subtitle?: string
  /** Icône centrée dans la pill colorée */
  icon?: ReactNode
  /** Couleur de la pill icône et du thème */
  color?: 'orange' | 'cyan' | 'teal' | 'rose' | 'emerald' | 'slate' | 'blue' | 'green' | 'purple' | 'red'
  /** Delta top-right : affiche "↑ {delta}" en emerald (ou "↓ {delta}" si négatif) */
  delta?: string
  /** Badge top-right alternatif au delta (ex: "cette sem.") */
  badge?: string
  className?: string
  animate?: boolean
}

const colorClasses: Record<NonNullable<StatCardProps['color']>, { pill: string; icon: string }> = {
  orange: {
    pill: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-500 dark:text-orange-400',
  },
  cyan: {
    pill: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: 'text-cyan-500 dark:text-cyan-400',
  },
  teal: {
    pill: 'bg-teal-100 dark:bg-teal-900/30',
    icon: 'text-teal-500 dark:text-teal-400',
  },
  rose: {
    pill: 'bg-rose-100 dark:bg-rose-900/30',
    icon: 'text-rose-400 dark:text-rose-300',
  },
  emerald: {
    pill: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: 'text-emerald-500 dark:text-emerald-400',
  },
  slate: {
    pill: 'bg-slate-100 dark:bg-slate-700',
    icon: 'text-slate-500 dark:text-slate-400',
  },
  blue: {
    pill: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-500 dark:text-blue-400',
  },
  green: {
    pill: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    pill: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-500 dark:text-purple-400',
  },
  red: {
    pill: 'bg-red-100 dark:bg-red-900/30',
    icon: 'text-red-500 dark:text-red-400',
  },
}

/**
 * StatCard — carte de métrique conforme aux maquettes dashboard/statistiques.
 *
 * @example
 * <StatCard
 *   title="Fitness (CTL)"
 *   value="74"
 *   subtitle="TSS/j"
 *   icon={<Sparkles className="w-4 h-4" />}
 *   color="orange"
 *   delta="↑ 3"
 * />
 * <StatCard title="Séances" value="5 / 6" icon={<CheckCircle2 />} color="teal" badge="cette sem." />
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'orange',
  delta,
  badge,
  className,
  animate = false,
}: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5',
        'transition-all duration-300',
        animate && 'animate-fade-in-up',
        className
      )}
    >
      {/* Top row: icon pill + delta/badge */}
      <div className="flex items-start justify-between">
        {icon && (
          <div
            className={clsx(
              'w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-none',
              colors.pill
            )}
          >
            <div className={colors.icon}>{icon}</div>
          </div>
        )}
        {/* Delta (↑ / ↓) */}
        {delta && !badge && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {delta}
          </span>
        )}
        {/* Badge pill alternatif */}
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
            {badge}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {title}
      </p>

      {/* Valeur + unité */}
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[25px] font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-none">
          {value}
        </span>
        {subtitle && (
          <span className="text-sm text-gray-400 dark:text-gray-500">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
