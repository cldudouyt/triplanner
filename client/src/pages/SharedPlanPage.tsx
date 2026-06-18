import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Copy, Calendar, Layers, BarChart2 } from 'lucide-react'
import { trainingPlansApi, type TrainingSession } from '@/api/trainingPlans.api'
import { useAuth } from '@/context/AuthContext'
import { SESSION_TYPES, LEVELS } from '@/utils/constants'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const TARGET_TYPE_LABELS: Record<string, string> = {
  sprint: 'Triathlon Sprint',
  olympic: 'Triathlon Olympique',
  'half-ironman': 'Half-Ironman',
  ironman: 'Ironman',
  '5k': '5K',
  '10k': '10K',
  'semi-marathon': 'Semi-Marathon',
  marathon: 'Marathon',
  trail: 'Trail',
}

const LEVEL_BADGE: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
}

function SessionPill({ session }: { session: TrainingSession }) {
  const typeConfig = SESSION_TYPES.find(t => t.value === session.type)
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
      <span style={{ color: typeConfig?.color }}>{typeConfig?.icon}</span>
      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
        {session.title || typeConfig?.label}
      </span>
      {session.duration && (
        <span className="text-gray-400 dark:text-gray-500 shrink-0">{session.duration}min</span>
      )}
    </div>
  )
}

export default function SharedPlanPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ['shared-plan', shareCode],
    queryFn: () => trainingPlansApi.getShared(shareCode!).then(r => r.data),
    enabled: !!shareCode,
    retry: false,
  })

  const copyMutation = useMutation({
    mutationFn: () => trainingPlansApi.copyPlan(plan!.id),
    onSuccess: (res) => {
      navigate(`/training/${res.data.id}`)
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-6xl">🔒</div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Plan introuvable</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Ce plan n'existe pas ou n'est plus partagé.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }

  // Group sessions by week
  const weeks: Record<number, TrainingSession[]> = {}
  for (let w = 1; w <= plan.durationWeeks; w++) {
    weeks[w] = plan.sessions.filter(s => s.weekNumber === w)
  }

  const levelConfig = LEVELS.find(l => l.value === plan.level)
  const authorName = plan.user ? `${plan.user.firstName} ${plan.user.lastName}` : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Plan partagé — Tri Planner
          </span>
          {isAuthenticated && (
            <button
              onClick={() => copyMutation.mutate()}
              disabled={copyMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <Copy className="h-4 w-4" />
              {copyMutation.isPending ? 'Copie...' : 'Copier ce plan'}
            </button>
          )}
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Se connecter pour copier
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        {/* Plan header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{plan.name}</h1>
                {levelConfig && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${LEVEL_BADGE[plan.level || ''] || 'bg-gray-100 text-gray-700'}`}>
                    {levelConfig.label}
                  </span>
                )}
              </div>
              {authorName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Par {authorName}
                </p>
              )}
              {plan.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Épreuve</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {TARGET_TYPE_LABELS[plan.targetType] || plan.targetType}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Durée</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {plan.durationWeeks} semaines
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                <BarChart2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Séances</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {plan.sessions.length} au total
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copy CTA for non-authenticated */}
        {!isAuthenticated && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Connectez-vous pour copier ce plan dans votre compte et commencer l'entraînement.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Se connecter
            </button>
          </div>
        )}

        {/* Weeks */}
        <div className="space-y-4">
          {Object.entries(weeks).map(([weekStr, sessions]) => {
            const week = Number(weekStr)
            return (
              <div key={week} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Semaine {week}</h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{sessions.length} séance{sessions.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day, idx) => {
                    const daySessions = sessions.filter(s => s.dayOfWeek === idx + 1)
                    return (
                      <div key={idx} className="min-h-[60px]">
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 text-center">{day}</p>
                        <div className="space-y-1">
                          {daySessions.map(s => (
                            <SessionPill key={s.id} session={s} />
                          ))}
                          {daySessions.length === 0 && (
                            <div className="h-8 rounded border border-dashed border-gray-100 dark:border-slate-700" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
