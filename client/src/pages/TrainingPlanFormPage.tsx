import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { trainingPlansApi, type CompetitionIdInput } from '@/api/trainingPlans.api'
import { aiApi } from '@/api/ai.api'
import { competitionsApi } from '@/api/competitions.api'
import { formatDate } from '@/utils/formatDate'
import { LEVELS } from '@/utils/constants'
import { useState, useEffect } from 'react'
import { Sparkles, Loader2, User, Target, Zap, Info } from 'lucide-react'

const LEVEL_ICONS: Record<string, string> = {
  beginner: '🌱',
  intermediate: '💪',
  advanced: '🏆',
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'border-green-400 bg-green-50 ring-green-400',
  intermediate: 'border-blue-400 bg-blue-50 ring-blue-400',
  advanced: 'border-purple-400 bg-purple-50 ring-purple-400',
}

// Sprint triathlon distances auto-fill
const SPRINT_DISTANCES_BY_TYPE: Record<string, string> = {
  sprint: 'Triathlon Sprint : 750m natation / 20km vélo / 5km course à pied',
  olympic: 'Triathlon Olympique : 1500m natation / 40km vélo / 10km course à pied',
  'half-ironman': 'Half-Ironman (70.3) : 1900m natation / 90km vélo / 21km course à pied',
  ironman: 'Ironman (140.6) : 3800m natation / 180km vélo / 42km course à pied',
}

export default function TrainingPlanFormPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [selectedCompetitions, setSelectedCompetitions] = useState<CompetitionIdInput[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string>('intermediate')
  const [aiObjective, setAiObjective] = useState('')
  const [aiConstraints, setAiConstraints] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      targetType: 'sprint',
      durationWeeks: 8,
      weeklyHours: 6,
      startDate: '',
      autoGenerate: true,
    },
  })

  const startDate = watch('startDate')
  const name = watch('name')
  const targetType = watch('targetType')
  const durationWeeks = watch('durationWeeks')
  const weeklyHours = watch('weeklyHours')

  const { data: competitionsData } = useQuery({
    queryKey: ['competitions-for-link'],
    queryFn: () => competitionsApi.list({ sortBy: 'date', sortOrder: 'asc', limit: 100 }).then(r => r.data),
  })

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => aiApi.getStatus().then(r => r.data),
    retry: false,
  })

  // Auto-fill distances when a triathlon competition is selected as primary
  useEffect(() => {
    if (selectedCompetitions.length === 0) return
    const primaryComp = competitionsData?.data.find(
      c => selectedCompetitions.find(s => s.id === c.id && s.isPrimary)
    )
    if (!primaryComp) return

    // Determine triathlon type from competition subType or targetType
    const compSubType = (primaryComp.subType || '').toLowerCase()
    const autoText = SPRINT_DISTANCES_BY_TYPE[compSubType] || SPRINT_DISTANCES_BY_TYPE[targetType] || ''
    if (autoText && !aiObjective) {
      setAiObjective(autoText)
    }
  }, [selectedCompetitions, competitionsData, targetType])

  // Auto-fill distances when targetType changes to a triathlon type
  useEffect(() => {
    const autoText = SPRINT_DISTANCES_BY_TYPE[targetType]
    if (autoText && !aiObjective) {
      setAiObjective(autoText)
    }
  }, [targetType])

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

  const onSubmit = async (data: any) => {
    try {
      setError('')
      const payload = {
        ...data,
        durationWeeks: Number(data.durationWeeks),
        weeklyHours: data.weeklyHours ? Number(data.weeklyHours) : undefined,
        level: selectedLevel,
        competitionIds: selectedCompetitions.length > 0 ? selectedCompetitions : undefined,
        startDate: data.startDate || undefined,
        autoGenerate: data.autoGenerate && data.startDate ? true : undefined,
      }
      const { data: plan } = await trainingPlansApi.create(payload)
      navigate(`/training/${plan.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la creation')
    }
  }

  const handleAIGenerate = async () => {
    if (!name) {
      setError('Veuillez saisir un nom pour le plan')
      return
    }
    try {
      setError('')
      setAiLoading(true)
      const { data: plan } = await aiApi.generatePlan({
        name,
        targetType,
        durationWeeks: Number(durationWeeks),
        level: selectedLevel,
        weeklyHours: weeklyHours ? Number(weeklyHours) : undefined,
        startDate: startDate || undefined,
        objective: aiObjective || undefined,
        constraints: aiConstraints || undefined,
      })
      navigate(`/training/${plan.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la generation IA')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouveau plan d'entrainement</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* Section 1: Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informations de base</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du plan *</label>
            <input
              {...register('name', { required: 'Requis' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: Prepa Marathon Paris 2026"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Section 2: Level selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Votre niveau</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LEVELS.map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => setSelectedLevel(level.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedLevel === level.value
                    ? `${LEVEL_COLORS[level.value]} ring-2`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="text-2xl mb-1">{LEVEL_ICONS[level.value]}</div>
                <div className="font-semibold text-gray-900 text-sm">{level.label}</div>
                <div className="text-xs text-gray-500 mt-1">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Objective */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Objectif</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'epreuve</label>
              <select {...register('targetType')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="sprint">Triathlon Sprint</option>
                <option value="olympic">Triathlon Olympique</option>
                <option value="half-ironman">Half-Ironman</option>
                <option value="ironman">Ironman</option>
                <option value="5k">5K</option>
                <option value="10k">10K</option>
                <option value="semi-marathon">Semi-Marathon</option>
                <option value="marathon">Marathon</option>
                <option value="trail">Trail</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duree (semaines) *</label>
              <input
                type="number"
                {...register('durationWeeks', { required: 'Requis', min: 1, valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heures disponibles par semaine</label>
            <input
              type="number"
              {...register('weeklyHours', { min: 2, max: 25, valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: 6"
            />
            <p className="text-xs text-gray-400 mt-1">Entre 2 et 25 heures</p>
          </div>
        </div>

        {/* Section 4: Planning */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Planification</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de debut</label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competitions cibles (optionnel)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {competitionsData?.data.length === 0 && (
                <p className="text-sm text-gray-400">Aucune competition disponible</p>
              )}
              {competitionsData?.data.map(c => {
                const isSelected = selectedCompetitions.some(s => s.id === c.id)
                const isPrimary = selectedCompetitions.find(s => s.id === c.id)?.isPrimary
                return (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCompetition(c.id)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); if (isSelected) setPrimaryCompetition(c.id) }}
                      className={`text-sm ${isPrimary ? 'text-yellow-500' : 'text-gray-300'} ${!isSelected ? 'opacity-30' : 'hover:text-yellow-400'}`}
                      disabled={!isSelected}
                      title="Definir comme objectif principal"
                    >
                      *
                    </button>
                    <span className="text-sm text-gray-700">{c.name} - {formatDate(c.date)}</span>
                    <span className="text-xs text-gray-400">({c.type})</span>
                  </label>
                )
              })}
            </div>
            {selectedCompetitions.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedCompetitions.length} competition(s) selectionnee(s)
              </p>
            )}
          </div>
        </div>

        {/* Section 5: Generation */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Generation du plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto generation */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-gray-900 text-sm">Generation automatique</h3>
              <p className="text-xs text-gray-500">
                Plan periodise genere automatiquement selon votre niveau et objectif
              </p>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="autoGenerate"
                  {...register('autoGenerate')}
                  className="h-4 w-4 text-blue-600 rounded"
                  disabled={!startDate}
                />
                <div>
                  <label htmlFor="autoGenerate" className={`text-sm font-medium ${startDate ? 'text-gray-700' : 'text-gray-400'}`}>
                    Generer les seances
                  </label>
                  <p className="text-xs text-gray-500">
                    {startDate
                      ? "Cree un plan periodise adapte a votre niveau"
                      : "Selectionnez une date de debut pour activer"
                    }
                  </p>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isSubmitting ? 'Creation...' : 'Creer le plan'}
              </button>
            </div>

            {/* AI generation */}
            {aiStatus?.available ? (
              <div className="border border-purple-200 rounded-xl p-4 space-y-3 bg-purple-50/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <h3 className="font-medium text-purple-900 text-sm">Generation IA (Claude)</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Plan personnalise genere par Claude AI avec periodisation intelligente
                </p>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Votre objectif</label>
                  <textarea
                    value={aiObjective}
                    onChange={e => setAiObjective(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="Finir mon premier triathlon sprint"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contraintes</label>
                  <textarea
                    value={aiConstraints}
                    onChange={e => setAiConstraints(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="3 jours d'entrainement max par semaine"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !name}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Claude génère votre plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generer avec Claude AI
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-400" />
                  <h3 className="font-medium text-gray-500 text-sm">Generation IA (Claude)</h3>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">IA non configurée</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Pour activer la génération par Claude AI, ajoutez votre clé API Anthropic dans le fichier <code className="bg-amber-100 px-1 rounded">.env</code> du serveur :<br />
                      <code className="bg-amber-100 px-1 rounded text-[10px]">ANTHROPIC_API_KEY=sk-ant-...</code>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Obtenez votre clé sur console.anthropic.com
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/training')} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
