import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Copy, Globe, Calendar, Layers, BarChart2 } from 'lucide-react'
import { trainingPlansApi, type TrainingPlan } from '@/api/trainingPlans.api'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { LEVELS } from '@/utils/constants'

const TARGET_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'sprint', label: 'Triathlon Sprint' },
  { value: 'olympic', label: 'Triathlon Olympique' },
  { value: 'half-ironman', label: 'Half-Ironman' },
  { value: 'ironman', label: 'Ironman' },
  { value: '5k', label: '5K' },
  { value: '10k', label: '10K' },
  { value: 'semi-marathon', label: 'Semi-Marathon' },
  { value: 'marathon', label: 'Marathon' },
  { value: 'trail', label: 'Trail' },
]

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

function PlanCard({ plan, onView, onCopy, isCopying }: {
  plan: TrainingPlan
  onView: () => void
  onCopy: () => void
  isCopying: boolean
}) {
  const levelConfig = LEVELS.find(l => l.value === plan.level)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{plan.name}</h3>
          <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
        </div>
        {plan.user && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Par {plan.user.firstName} {plan.user.lastName}
          </p>
        )}
        {plan.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{plan.description}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {TARGET_TYPE_LABELS[plan.targetType] || plan.targetType}
        </span>
        {levelConfig && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${LEVEL_BADGE[plan.level || ''] || 'bg-gray-100 text-gray-700'}`}>
            {levelConfig.label}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2">
          <div className="flex items-center justify-center mb-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{plan.durationWeeks}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">semaines</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2">
          <div className="flex items-center justify-center mb-1">
            <BarChart2 className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {plan._count?.sessions ?? plan.sessions?.length ?? 0}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">séances</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2">
          <div className="flex items-center justify-center mb-1">
            <Layers className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {plan.weeklyHours ?? '—'}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">h/sem</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Eye className="h-4 w-4" />
          Voir
        </button>
        <button
          onClick={onCopy}
          disabled={isCopying}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          <Copy className="h-4 w-4" />
          {isCopying ? 'Copie...' : 'Copier'}
        </button>
      </div>
    </div>
  )
}

export default function PublicPlansPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [targetType, setTargetType] = useState('')
  const [level, setLevel] = useState('')
  const [copyingId, setCopyingId] = useState<number | null>(null)

  const { data: plans, isLoading } = useQuery({
    queryKey: ['public-plans', targetType, level],
    queryFn: () => trainingPlansApi.getPublic({
      targetType: targetType || undefined,
      level: level || undefined,
    }).then(r => r.data),
  })

  const copyMutation = useMutation({
    mutationFn: (planId: number) => trainingPlansApi.copyPlan(planId),
    onMutate: (planId) => setCopyingId(planId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] })
      navigate(`/training/${res.data.id}`)
    },
    onSettled: () => setCopyingId(null),
  })

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Découvrir des plans</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Parcourez les plans d'entraînement partagés par la communauté.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={targetType}
          onChange={e => setTargetType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TARGET_TYPES.map(t => (
            <option key={t.value} value={t.value} className="dark:bg-slate-700">{t.label}</option>
          ))}
        </select>
        <select
          value={level}
          onChange={e => setLevel(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" className="dark:bg-slate-700">Tous les niveaux</option>
          {LEVELS.map(l => (
            <option key={l.value} value={l.value} className="dark:bg-slate-700">{l.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !plans?.length ? (
        <EmptyState
          variant="search"
          title="Aucun plan public"
          description="Aucun plan ne correspond à vos filtres, ou aucun plan n'a encore été partagé."
          action={{ label: 'Réinitialiser les filtres', onClick: () => { setTargetType(''); setLevel('') } }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onView={() => plan.shareCode ? navigate(`/plans/shared/${plan.shareCode}`) : undefined}
              onCopy={() => copyMutation.mutate(plan.id)}
              isCopying={copyingId === plan.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
