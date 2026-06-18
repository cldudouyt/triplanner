import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, BookTemplate, Dumbbell } from 'lucide-react'
import { trainingPlansApi, type CompetitionIdInput } from '@/api/trainingPlans.api'
import { competitionsApi } from '@/api/competitions.api'
import { formatDate } from '@/utils/formatDate'
import { LEVELS } from '@/utils/constants'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import clsx from 'clsx'

const LEVEL_BADGE_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
}

export default function TrainingPlansPage() {
  const navigate = useNavigate()
  const [templateModal, setTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [selectedCompetitions, setSelectedCompetitions] = useState<CompetitionIdInput[]>([])

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['training-plans'],
    queryFn: () => trainingPlansApi.list().then(r => r.data),
  })

  const plans = plansData?.data || []

  const { data: templates } = useQuery({
    queryKey: ['training-templates'],
    queryFn: () => trainingPlansApi.templates().then(r => r.data),
  })

  const { data: competitionsData } = useQuery({
    queryKey: ['competitions-for-link'],
    queryFn: () => competitionsApi.list({ sortBy: 'date', sortOrder: 'asc', limit: 100 }).then(r => r.data),
  })

  const toggleCompetition = (id: number) => {
    setSelectedCompetitions(prev => {
      const exists = prev.find(c => c.id === id)
      if (exists) {
        const filtered = prev.filter(c => c.id !== id)
        if (exists.isPrimary && filtered.length > 0) {
          return filtered.map((c, i) => ({ ...c, isPrimary: i === 0 }))
        }
        return filtered
      }
      return [...prev, { id, isPrimary: prev.length === 0 }]
    })
  }

  const setPrimaryCompetition = (id: number) => {
    setSelectedCompetitions(prev =>
      prev.map(c => ({ ...c, isPrimary: c.id === id }))
    )
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !startDate) return
    try {
      const { data } = await trainingPlansApi.createFromTemplate(selectedTemplate, {
        competitionIds: selectedCompetitions.length > 0 ? selectedCompetitions : undefined,
        startDate,
      })
      navigate(`/training/${data.id}`)
    } catch {
      alert('Erreur lors de la création du plan')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plans d'entraînement</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{plans.length} plan(s)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <BookTemplate className="h-4 w-4" />
            Depuis un template
          </button>
          <Link
            to="/training/new"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Plan personnalisé
          </Link>
        </div>
      </div>

      {/* Templates section */}
      {templates && templates.length > 0 && !templateModal && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Templates disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTemplate(t.id); setTemplateModal(true) }}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-left hover:shadow-md dark:hover:shadow-slate-900/50 transition-all hover:scale-[1.02]"
              >
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{t.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.durationWeeks} semaines - {t._count?.sessions || 0} séances</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User plans */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          variant="training"
          action={{
            label: 'Créer un plan',
            href: '/training/new',
          }}
          secondaryAction={{
            label: 'Utiliser un template',
            onClick: () => setTemplateModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Link
              key={plan.id}
              to={`/training/${plan.id}`}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-md dark:hover:shadow-slate-900/50 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                {plan.level && (() => {
                  const levelConfig = LEVELS.find(l => l.value === plan.level)
                  return levelConfig ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${LEVEL_BADGE_COLORS[plan.level] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'}`}>
                      {levelConfig.label}
                    </span>
                  ) : null
                })()}
              </div>
              {plan.competitions && plan.competitions.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {plan.competitions.length} objectif(s) : {plan.competitions.map(pc => pc.competition.name).join(', ')}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span>{plan.durationWeeks} semaines</span>
                <span>{plan._count?.sessions || 0} séances</span>
              </div>
              {plan.startDate && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Du {formatDate(plan.startDate)} au {plan.endDate ? formatDate(plan.endDate) : '...'}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Template modal */}
      {templateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setTemplateModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Créer depuis un template</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
                <select
                  value={selectedTemplate || ''}
                  onChange={e => setSelectedTemplate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="" className="dark:bg-slate-700">Sélectionner...</option>
                  {templates?.map(t => (
                    <option key={t.id} value={t.id} className="dark:bg-slate-700">{t.name} ({t.durationWeeks} sem.)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Compétitions cibles (optionnel)</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700">
                  {competitionsData?.data.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Aucune compétition</p>
                  )}
                  {competitionsData?.data.map(c => {
                    const isSelected = selectedCompetitions.some(s => s.id === c.id)
                    const isPrimary = selectedCompetitions.find(s => s.id === c.id)?.isPrimary
                    return (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 p-1 rounded text-sm transition-colors">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCompetition(c.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); if (isSelected) setPrimaryCompetition(c.id) }}
                          className={clsx(
                            isPrimary ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-500',
                            !isSelected ? 'opacity-30' : 'hover:text-yellow-400'
                          )}
                          disabled={!isSelected}
                        >
                          ⭐
                        </button>
                        <span className="text-gray-700 dark:text-gray-300">{c.name} - {formatDate(c.date)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setTemplateModal(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Annuler
              </button>
              <button
                onClick={handleCreateFromTemplate}
                disabled={!selectedTemplate || !startDate}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Créer le plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
