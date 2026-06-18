import clsx from 'clsx'
import { Trophy, Target, Dumbbell, Calendar, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SPORT_COLORS, LEVELS } from '@/utils/constants'

export interface OnboardingData {
  goal: string
  level: string
  disciplines: string[]
  firstCompetition: {
    name: string
    date: string
  } | null
}

interface OnboardingStepsProps {
  currentStep: number
  data: OnboardingData
  onDataChange: (data: OnboardingData) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

const goals = [
  { value: 'finish', label: 'Terminer ma première course', icon: '🎯', description: 'Objectif : franchir la ligne d\'arrivée' },
  { value: 'improve', label: 'Améliorer mes performances', icon: '📈', description: 'Battre mes records personnels' },
  { value: 'compete', label: 'Performer en compétition', icon: '🏆', description: 'Viser le podium' },
  { value: 'health', label: 'Rester en forme', icon: '❤️', description: 'Maintenir une bonne condition physique' },
]

const disciplines = [
  { value: 'swim', ...SPORT_COLORS.swim },
  { value: 'bike', ...SPORT_COLORS.bike },
  { value: 'run', ...SPORT_COLORS.run },
  { value: 'strength', ...SPORT_COLORS.strength },
]

export function OnboardingSteps({
  currentStep,
  data,
  onDataChange,
  onNext,
  onBack,
  onSkip,
}: OnboardingStepsProps) {
  const updateData = (updates: Partial<OnboardingData>) => {
    onDataChange({ ...data, ...updates })
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true // Welcome - always can proceed
      case 1: return !!data.goal
      case 2: return data.disciplines.length > 0
      case 3: return true // Competition is optional
      default: return false
    }
  }

  return (
    <div className="p-6">
      {/* Step 0: Welcome */}
      {currentStep === 0 && (
        <div className="text-center animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Bienvenue sur Tri Planner !
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
            Configurons ensemble votre espace pour vous aider à atteindre vos objectifs sportifs.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={onNext} icon={<ChevronRight className="w-4 h-4" />} iconPosition="right" className="w-full">
              Commencer la configuration
            </Button>
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Passer pour l'instant
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Goal */}
      {currentStep === 1 && (
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Quel est votre objectif ?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Étape 1 sur 3
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {goals.map((goal) => (
              <button
                key={goal.value}
                onClick={() => updateData({ goal: goal.value })}
                className={clsx(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                  data.goal === goal.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                )}
              >
                <span className="text-2xl">{goal.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{goal.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{goal.description}</p>
                </div>
                {data.goal === goal.value && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} icon={<ChevronLeft className="w-4 h-4" />}>
              Retour
            </Button>
            <Button onClick={onNext} disabled={!canProceed()} className="flex-1" icon={<ChevronRight className="w-4 h-4" />} iconPosition="right">
              Continuer
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Disciplines */}
      {currentStep === 2 && (
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Quelles disciplines pratiquez-vous ?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Étape 2 sur 3 · Sélectionnez une ou plusieurs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {disciplines.map((disc) => {
              const isSelected = data.disciplines.includes(disc.value)
              return (
                <button
                  key={disc.value}
                  onClick={() => {
                    const newDisciplines = isSelected
                      ? data.disciplines.filter((d) => d !== disc.value)
                      : [...data.disciplines, disc.value]
                    updateData({ disciplines: newDisciplines })
                  }}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                    isSelected
                      ? `border-current ${disc.text} ${disc.bgLight}`
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  )}
                >
                  <span className="text-3xl">{disc.icon}</span>
                  <span className={clsx(
                    'font-medium',
                    isSelected ? disc.text : 'text-gray-900 dark:text-gray-100'
                  )}>
                    {disc.name}
                  </span>
                  {isSelected && (
                    <Check className={clsx('w-5 h-5', disc.text)} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Level selection */}
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Votre niveau sportif
            </p>
            <div className="flex gap-2">
              {LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => updateData({ level: level.value })}
                  className={clsx(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                    data.level === level.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} icon={<ChevronLeft className="w-4 h-4" />}>
              Retour
            </Button>
            <Button onClick={onNext} disabled={!canProceed()} className="flex-1" icon={<ChevronRight className="w-4 h-4" />} iconPosition="right">
              Continuer
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: First Competition (Optional) */}
      {currentStep === 3 && (
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
              <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Avez-vous une compétition en vue ?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Étape 3 sur 3 · Optionnel
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom de la compétition
              </label>
              <input
                type="text"
                placeholder="Ex: Marathon de Paris"
                value={data.firstCompetition?.name || ''}
                onChange={(e) =>
                  updateData({
                    firstCompetition: e.target.value
                      ? { name: e.target.value, date: data.firstCompetition?.date || '' }
                      : null,
                  })
                }
                className={clsx(
                  'w-full px-4 py-2.5 rounded-xl border',
                  'bg-white dark:bg-slate-800',
                  'text-gray-900 dark:text-gray-100',
                  'placeholder-gray-400 dark:placeholder-gray-500',
                  'border-gray-300 dark:border-slate-600',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Date prévue
              </label>
              <input
                type="date"
                value={data.firstCompetition?.date || ''}
                onChange={(e) =>
                  updateData({
                    firstCompetition: data.firstCompetition
                      ? { ...data.firstCompetition, date: e.target.value }
                      : { name: '', date: e.target.value },
                  })
                }
                className={clsx(
                  'w-full px-4 py-2.5 rounded-xl border',
                  'bg-white dark:bg-slate-800',
                  'text-gray-900 dark:text-gray-100',
                  'border-gray-300 dark:border-slate-600',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                )}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-8">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Pas encore de compétition ?
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Pas de problème ! Vous pourrez en ajouter une plus tard depuis votre tableau de bord.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} icon={<ChevronLeft className="w-4 h-4" />}>
              Retour
            </Button>
            <Button onClick={onNext} className="flex-1" pulse>
              Terminer la configuration
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
