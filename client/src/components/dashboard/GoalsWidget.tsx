import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Target } from 'lucide-react'
import { goalsApi, type GoalWithProgress } from '@/api/goals.api'
import { SPORT_COLORS } from '@/utils/constants'

function getSportColorHex(sport: GoalWithProgress['sport']): string {
  if (sport === 'all') return '#3b82f6' // blue-500
  const entry = SPORT_COLORS[sport as keyof typeof SPORT_COLORS]
  return entry ? entry.color : '#3b82f6'
}

export default function GoalsWidget() {
  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.list().then(r => r.data),
  })

  const top3 = goals?.slice(0, 3) ?? []

  if (!top3.length) return null

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
          <Target className="w-4 h-4 text-blue-500" />
          Objectifs {new Date().getFullYear()}
        </h3>
        <Link
          to="/goals"
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          Voir tout →
        </Link>
      </div>
      <div className="space-y-3">
        {top3.map(goal => {
          const label = goal.label ?? `${goal.sport} ${goal.type}`
          const color = getSportColorHex(goal.sport)
          const pct = Math.min(goal.percentage, 100)
          return (
            <div key={goal.id}>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span className="truncate pr-2">{label}</span>
                <span className="shrink-0">
                  {goal.currentValue}/{goal.targetValue} {goal.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
