import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Target, Plus, Trash2, TrendingUp } from 'lucide-react'
import { goalsApi, type CreateGoalInput, type GoalWithProgress } from '@/api/goals.api'
import { SPORT_COLORS } from '@/utils/constants'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

const SPORT_LABELS: Record<GoalWithProgress['sport'], string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
  strength: 'Renforcement',
  all: 'Tous sports',
}

const TYPE_LABELS: Record<GoalWithProgress['type'], string> = {
  distance: 'Distance',
  duration: 'Durée',
  sessions: 'Séances',
}

function getSportColorHex(sport: GoalWithProgress['sport']): string {
  if (sport === 'all') return '#3b82f6' // blue-500
  const entry = SPORT_COLORS[sport as keyof typeof SPORT_COLORS]
  return entry ? entry.color : '#3b82f6'
}

interface GoalCardProps {
  goal: GoalWithProgress
  onDelete: (id: number) => void
  isDeleting: boolean
}

function GoalCard({ goal, onDelete, isDeleting }: GoalCardProps) {
  const sportLabel = SPORT_LABELS[goal.sport]
  const typeLabel = TYPE_LABELS[goal.type]
  const title = goal.label ?? `${sportLabel} — ${typeLabel}`
  const color = getSportColorHex(goal.sport)
  const pct = Math.min(goal.percentage, 100)
  const isCompleted = goal.percentage >= 100

  return (
    <Card animate>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h3>
              {isCompleted && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 shrink-0">
                  Objectif atteint 🎯
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{goal.currentValue}</span>
                {' / '}
                {goal.targetValue} {goal.unit}
              </span>
              <span className="font-medium" style={{ color }}>{pct}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>

            {/* Projection */}
            {goal.projection > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <TrendingUp className="w-3 h-3" />
                <span>Projeté : ~{goal.projection} {goal.unit} fin d'année</span>
              </div>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={() => onDelete(goal.id)}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0 disabled:opacity-50"
            aria-label="Supprimer l'objectif"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

const CURRENT_YEAR = new Date().getFullYear()

const DEFAULT_FORM: CreateGoalInput = {
  sport: 'run',
  year: CURRENT_YEAR,
  type: 'distance',
  targetValue: 100,
  unit: 'km',
  label: '',
}

export default function GoalsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateGoalInput>(DEFAULT_FORM)
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', selectedYear],
    queryFn: () => goalsApi.list(selectedYear).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateGoalInput) => goalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setShowForm(false)
      setForm(DEFAULT_FORM)
      toast.success('Objectif créé !')
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => goalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Objectif supprimé')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      label: form.label?.trim() || undefined,
    })
  }

  const handleChange = (field: keyof CreateGoalInput, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Target className="w-7 h-7 text-blue-500" />
            Objectifs de saison
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Suivez vos objectifs annuels par sport</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
              <option key={y} value={y} className="dark:bg-slate-700">{y}</option>
            ))}
          </select>
          <Button
            onClick={() => setShowForm(v => !v)}
            icon={<Plus className="w-4 h-4" />}
          >
            Ajouter un objectif
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 mb-6 animate-scale-in">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouvel objectif</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Sport */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sport</label>
                <select
                  value={form.sport}
                  onChange={e => handleChange('sport', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="swim" className="dark:bg-slate-700">Natation</option>
                  <option value="bike" className="dark:bg-slate-700">Vélo</option>
                  <option value="run" className="dark:bg-slate-700">Course</option>
                  <option value="strength" className="dark:bg-slate-700">Renforcement</option>
                  <option value="all" className="dark:bg-slate-700">Tous sports</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={e => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="distance" className="dark:bg-slate-700">Distance</option>
                  <option value="duration" className="dark:bg-slate-700">Durée</option>
                  <option value="sessions" className="dark:bg-slate-700">Séances</option>
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Année</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={e => handleChange('year', Number(e.target.value))}
                  min={2020}
                  max={2100}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Target value */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valeur cible</label>
                <input
                  type="number"
                  value={form.targetValue}
                  onChange={e => handleChange('targetValue', Number(e.target.value))}
                  min={1}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Unité</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={e => handleChange('unit', e.target.value)}
                  placeholder="km, hours, sessions"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom (optionnel)</label>
                <input
                  type="text"
                  value={form.label ?? ''}
                  onChange={e => handleChange('label', e.target.value)}
                  placeholder="Nom personnalisé"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Créer l'objectif
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !goals || goals.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Aucun objectif défini</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Définissez vos objectifs de saison pour suivre vos progrès tout au long de l'année.
          </p>
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
            Définir mes objectifs de saison
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={id => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
