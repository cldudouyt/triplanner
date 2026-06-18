import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trophy, ChevronDown, ChevronUp, CheckSquare, Square, Clock, Flag } from 'lucide-react'
import { competitionsApi } from '@/api/competitions.api'
import { SPORT_COLORS } from '@/utils/constants'

// --- Chrono helpers ---

interface TimeLeft {
  h: number
  m: number
  s: number
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

// --- Split ratios ---

type SplitKey = 'swim' | 't1' | 'bike' | 't2' | 'run'

const SPLIT_RATIOS: Record<string, Record<SplitKey, number>> = {
  sprint: { swim: 0.17, t1: 0.04, bike: 0.39, t2: 0.03, run: 0.37 },
  olympic: { swim: 0.16, t1: 0.03, bike: 0.42, t2: 0.02, run: 0.37 },
  half: { swim: 0.16, t1: 0.02, bike: 0.43, t2: 0.02, run: 0.37 },
  'half-ironman': { swim: 0.16, t1: 0.02, bike: 0.43, t2: 0.02, run: 0.37 },
}

const DEFAULT_RATIOS: Record<SplitKey, number> = { swim: 0.17, t1: 0.04, bike: 0.39, t2: 0.03, run: 0.37 }

function parseObjectiveMinutes(objective: string): number | null {
  // Formats: "1h25", "1:25:00", "85", "1h25m30"
  const matchHM = objective.match(/^(\d+)h(\d+)(?:m(\d+)?)?$/)
  if (matchHM) {
    return parseInt(matchHM[1]) * 60 + parseInt(matchHM[2]) + (matchHM[3] ? parseInt(matchHM[3]) / 60 : 0)
  }
  const matchHMS = objective.match(/^(\d+):(\d+):(\d+)$/)
  if (matchHMS) {
    return parseInt(matchHMS[1]) * 60 + parseInt(matchHMS[2]) + parseInt(matchHMS[3]) / 60
  }
  const matchHMColon = objective.match(/^(\d+):(\d+)$/)
  if (matchHMColon) {
    return parseInt(matchHMColon[1]) * 60 + parseInt(matchHMColon[2])
  }
  const matchMin = objective.match(/^(\d+)$/)
  if (matchMin) return parseInt(matchMin[1])
  return null
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}min`
  return m > 0 ? `${h}h${pad(m)}` : `${h}h`
}

// --- Checklist data ---

interface ChecklistItem {
  id: string
  label: string
}

interface ChecklistGroup {
  id: string
  label: string
  items: ChecklistItem[]
}

const CHECKLIST_GROUPS: ChecklistGroup[] = [
  {
    id: 'pre',
    label: 'Pré-départ',
    items: [
      { id: 'dossard', label: 'Dossard' },
      { id: 'combinaison', label: 'Combinaison' },
      { id: 'lunettes', label: 'Lunettes natation' },
      { id: 'velo', label: 'Vélo + casque' },
      { id: 'ravitaillement', label: 'Ravitaillement' },
      { id: 'hydratation', label: 'Hydratation' },
    ],
  },
  {
    id: 't1',
    label: 'Transition T1',
    items: [
      { id: 't1-casque', label: 'Casque vélo prêt' },
      { id: 't1-chaussures', label: 'Chaussures vélo' },
      { id: 't1-chaussettes', label: 'Chaussettes' },
    ],
  },
  {
    id: 't2',
    label: 'Transition T2',
    items: [
      { id: 't2-chaussures', label: 'Chaussures course' },
      { id: 't2-dossard', label: 'Dossard' },
      { id: 't2-casquette', label: 'Casquette/Visière' },
    ],
  },
  {
    id: 'post',
    label: 'Post-course',
    items: [
      { id: 'post-vetements', label: 'Vêtements chauds' },
      { id: 'post-resultat', label: 'Saisir le résultat' },
    ],
  },
]

// --- Main page ---

export default function RaceDayPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition', id],
    queryFn: () => competitionsApi.get(Number(id)).then(r => r.data),
    enabled: !!id,
  })

  // Countdown
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    if (!competition) return
    const calc = () => {
      const now = new Date()
      const raceDate = new Date(competition.date)
      if (competition.startTime) {
        const [h, m] = competition.startTime.split(':').map(Number)
        raceDate.setHours(h, m, 0, 0)
      }
      const diff = raceDate.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeLeft(null)
        return
      }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const intervalId = setInterval(calc, 1000)
    return () => clearInterval(intervalId)
  }, [competition])

  // Checklist state
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_GROUPS.map(g => [g.id, true]))
  )

  const toggleItem = (itemId: string) => {
    setChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  // Result form
  const [showResultForm, setShowResultForm] = useState(false)
  const [resultValue, setResultValue] = useState('')
  const [notesValue, setNotesValue] = useState('')

  const updateMutation = useMutation({
    mutationFn: (data: { status: string; result?: string; notes?: string }) =>
      competitionsApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      queryClient.invalidateQueries({ queryKey: ['competition', id] })
      navigate(`/competitions/${id}`)
    },
  })

  const handleSaveResult = () => {
    updateMutation.mutate({
      status: 'completed',
      result: resultValue || undefined,
      notes: notesValue || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48 animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Compétition introuvable.</p>
        <Link to="/competitions" className="text-violet-600 hover:underline mt-4 inline-block">
          Retour aux compétitions
        </Link>
      </div>
    )
  }

  // Splits calculation
  const ratios = SPLIT_RATIOS[competition.subType?.toLowerCase()] || DEFAULT_RATIOS
  const totalMinutes = competition.chronoObjective
    ? parseObjectiveMinutes(competition.chronoObjective)
    : null

  const splits: { key: SplitKey; label: string; colorClass: string; icon: string }[] = [
    { key: 'swim', label: 'Natation', colorClass: SPORT_COLORS.swim.text, icon: SPORT_COLORS.swim.icon },
    { key: 't1', label: 'T1', colorClass: 'text-slate-500 dark:text-slate-400', icon: '⚡' },
    { key: 'bike', label: 'Vélo', colorClass: SPORT_COLORS.bike.text, icon: SPORT_COLORS.bike.icon },
    { key: 't2', label: 'T2', colorClass: 'text-slate-500 dark:text-slate-400', icon: '⚡' },
    { key: 'run', label: 'Course', colorClass: SPORT_COLORS.run.text, icon: SPORT_COLORS.run.icon },
  ]

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link
          to={`/competitions/${competition.id}`}
          className="mt-1 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              RACE DAY
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {competition.name}
          </h1>
          {competition.location && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{competition.location}</p>
          )}
        </div>
      </div>

      {/* Grid 2 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* === Section 1 : Countdown === */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-violet-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-white/80" />
            <h2 className="font-semibold text-white/90">Départ dans</h2>
          </div>
          {timeLeft !== null ? (
            <div className="font-mono tabular-nums text-5xl font-bold tracking-tight text-center py-4">
              {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-4xl font-bold">C'est parti !</p>
              <p className="text-white/70 text-sm mt-2">Bonne course !</p>
            </div>
          )}
          {competition.startTime && (
            <p className="text-white/60 text-xs text-center mt-2">
              Départ prévu à {competition.startTime}
            </p>
          )}
        </div>

        {/* === Section 2 : Splits cibles === */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-violet-500" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Splits cibles</h2>
          </div>
          {totalMinutes !== null ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left pb-2 text-gray-500 dark:text-gray-400 font-medium">Segment</th>
                  <th className="text-right pb-2 text-gray-500 dark:text-gray-400 font-medium">Temps</th>
                  <th className="text-right pb-2 text-gray-500 dark:text-gray-400 font-medium">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {splits.map(({ key, label, colorClass, icon }) => (
                  <tr key={key}>
                    <td className={`py-2 font-medium flex items-center gap-1.5 ${colorClass}`}>
                      <span>{icon}</span>
                      <span>{label}</span>
                    </td>
                    <td className="py-2 text-right font-mono text-gray-800 dark:text-gray-200">
                      {formatMinutes(totalMinutes * ratios[key])}
                    </td>
                    <td className="py-2 text-right text-gray-400 dark:text-gray-500 text-xs">
                      {Math.round(ratios[key] * 100)}%
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 dark:border-slate-600">
                  <td className="pt-2 font-bold text-gray-900 dark:text-gray-100">Total</td>
                  <td className="pt-2 text-right font-mono font-bold text-violet-600 dark:text-violet-400">
                    {formatMinutes(totalMinutes)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              Définissez un objectif chrono pour voir vos splits cibles
            </p>
          )}
        </div>

        {/* === Section 3 : Checklist === */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Checklist race-day</h2>
          </div>
          <div className="space-y-2">
            {CHECKLIST_GROUPS.map(group => {
              const isOpen = openGroups[group.id]
              const groupCheckedCount = group.items.filter(item => checked[item.id]).length
              return (
                <div
                  key={group.id}
                  className="border border-gray-100 dark:border-slate-700 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {group.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {groupCheckedCount}/{group.items.length}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <ul className="divide-y divide-gray-50 dark:divide-slate-700/50">
                      {group.items.map(item => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors text-left"
                          >
                            {checked[item.id] ? (
                              <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                            )}
                            <span
                              className={`text-sm transition-colors ${
                                checked[item.id]
                                  ? 'line-through text-gray-400 dark:text-gray-500'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {item.label}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* === Section 4 : Formulaire résultat === */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Résultat</h2>
          </div>
          {!showResultForm ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Enregistrez votre performance à la fin de la course.
              </p>
              <button
                type="button"
                onClick={() => setShowResultForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm"
              >
                <Trophy className="w-4 h-4" />
                Marquer comme terminé
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temps final
                </label>
                <input
                  type="text"
                  value={resultValue}
                  onChange={e => setResultValue(e.target.value)}
                  placeholder="ex: 1h32:45"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ressenti / Notes
                </label>
                <textarea
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  placeholder="Comment s'est passée la course ?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResultForm(false)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveResult}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
              {updateMutation.isError && (
                <p className="text-sm text-red-500">
                  Erreur lors de l'enregistrement. Veuillez réessayer.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
