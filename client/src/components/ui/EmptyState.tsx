import { type ReactNode } from 'react'
import clsx from 'clsx'
import { Trophy, Dumbbell, Calendar, BarChart3, Heart, Medal, Award, FolderOpen, Search, Plus } from 'lucide-react'
import { Button } from './Button'

type EmptyStateVariant = 'default' | 'competitions' | 'training' | 'calendar' | 'statistics' | 'wellness' | 'records' | 'achievements' | 'search'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const variantConfig: Record<EmptyStateVariant, { icon: ReactNode; defaultTitle: string; defaultDescription: string; color: string }> = {
  default: {
    icon: <FolderOpen className="w-12 h-12" />,
    defaultTitle: 'Rien à afficher',
    defaultDescription: 'Il n\'y a pas encore de données à afficher ici.',
    color: 'text-gray-400 dark:text-gray-500',
  },
  competitions: {
    icon: <Trophy className="w-12 h-12" />,
    defaultTitle: 'Aucune compétition',
    defaultDescription: 'Ajoutez votre première compétition pour commencer à planifier votre saison.',
    color: 'text-amber-400 dark:text-amber-500',
  },
  training: {
    icon: <Dumbbell className="w-12 h-12" />,
    defaultTitle: 'Pas de plan d\'entraînement',
    defaultDescription: 'Créez un plan d\'entraînement personnalisé pour atteindre vos objectifs.',
    color: 'text-blue-400 dark:text-blue-500',
  },
  calendar: {
    icon: <Calendar className="w-12 h-12" />,
    defaultTitle: 'Calendrier vide',
    defaultDescription: 'Aucune séance ou événement prévu. Ajoutez un plan d\'entraînement pour remplir votre calendrier.',
    color: 'text-green-400 dark:text-green-500',
  },
  statistics: {
    icon: <BarChart3 className="w-12 h-12" />,
    defaultTitle: 'Pas encore de statistiques',
    defaultDescription: 'Commencez à enregistrer vos séances pour voir apparaître vos statistiques.',
    color: 'text-purple-400 dark:text-purple-500',
  },
  wellness: {
    icon: <Heart className="w-12 h-12" />,
    defaultTitle: 'Aucun suivi bien-être',
    defaultDescription: 'Effectuez votre premier check-in quotidien pour suivre votre forme.',
    color: 'text-red-400 dark:text-red-500',
  },
  records: {
    icon: <Medal className="w-12 h-12" />,
    defaultTitle: 'Pas de records',
    defaultDescription: 'Enregistrez vos performances pour voir apparaître vos records personnels.',
    color: 'text-orange-400 dark:text-orange-500',
  },
  achievements: {
    icon: <Award className="w-12 h-12" />,
    defaultTitle: 'Pas encore de badges',
    defaultDescription: 'Continuez à vous entraîner pour débloquer vos premiers badges !',
    color: 'text-cyan-400 dark:text-cyan-500',
  },
  search: {
    icon: <Search className="w-12 h-12" />,
    defaultTitle: 'Aucun résultat',
    defaultDescription: 'Aucun élément ne correspond à votre recherche. Essayez d\'autres mots-clés.',
    color: 'text-gray-400 dark:text-gray-500',
  },
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant]

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        'animate-fade-in',
        className
      )}
    >
      {/* Illustration */}
      <div
        className={clsx(
          'mb-4 p-4 rounded-full',
          'bg-gray-100 dark:bg-slate-800',
          config.color
        )}
      >
        {config.icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title || config.defaultTitle}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {description || config.defaultDescription}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              icon={action.icon || <Plus className="w-4 h-4" />}
              pulse
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function EmptyStateInline({
  message,
  action,
  className,
}: {
  message: string
  action?: { label: string; onClick: () => void }
  className?: string
}) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center gap-3 py-8 text-sm text-gray-500 dark:text-gray-400',
        className
      )}
    >
      <span>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
