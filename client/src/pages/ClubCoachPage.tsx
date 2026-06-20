import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Eye, Sparkles, Send, ArrowRightFromLine } from 'lucide-react'
import toast from 'react-hot-toast'
import { clubApi, type RosterAthlete, type AiSuggestion, type PlanSuggestion } from '@/api/club.api'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

function getAvatarGradient(name: string): string {
  const palettes = [
    'linear-gradient(135deg,#FB923C,#EA580C)', // orange
    'linear-gradient(135deg,#94A3B8,#64748B)', // slate
    'linear-gradient(135deg,#34D399,#059669)', // teal
    'linear-gradient(135deg,#60A5FA,#3B82F6)', // blue
    'linear-gradient(135deg,#A78BFA,#7C3AED)', // violet
  ]
  return palettes[name.charCodeAt(0) % palettes.length]
}

export default function ClubCoachPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedAthlete, setSelectedAthlete] = useState<RosterAthlete | null>(null)
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([])
  const [currentSuggestion, setCurrentSuggestion] = useState<PlanSuggestion | null>(null)
  const [coachNote, setCoachNote] = useState('')

  const { data: clubInfo, isLoading: clubLoading } = useQuery({
    queryKey: ['club-info'],
    queryFn: () => clubApi.getInfo().then(r => r.data),
  })

  const { data: roster, isLoading: rosterLoading } = useQuery({
    queryKey: ['club-roster'],
    queryFn: () => clubApi.getRoster().then(r => r.data),
  })

  const generateMutation = useMutation({
    mutationFn: (data: Parameters<typeof clubApi.generateSuggestions>[0]) =>
      clubApi.generateSuggestions(data).then(r => r.data),
    onSuccess: data => {
      setCurrentSuggestion(data)
      const parsed =
        typeof data.suggestions === 'string'
          ? (JSON.parse(data.suggestions) as AiSuggestion[])
          : (data.suggestions as AiSuggestion[])
      setSuggestions(Array.isArray(parsed) ? parsed : [])
    },
  })

  const toggleSuggestion = (id: string) =>
    setSuggestions(p => p.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)))

  const handleSelectAthlete = (athlete: RosterAthlete) => {
    setSelectedAthlete(athlete)
    setCurrentSuggestion(null)
    setSuggestions([])
    setCoachNote('')
  }

  const handleSendPlan = () => {
    if (!currentSuggestion) return
    clubApi
      .sendPlan({
        suggestionId: currentSuggestion.id,
        appliedIds: suggestions.filter(s => s.enabled).map(s => s.id),
        coachNote,
      })
      .then(() => {
        toast.success('Plan envoyé !')
        setSelectedAthlete(null)
        setSuggestions([])
        setCurrentSuggestion(null)
        queryClient.invalidateQueries({ queryKey: ['club-roster'] })
      })
  }

  if (clubLoading || rosterLoading) return <SkeletonDashboard />

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Espace Coach</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {clubInfo?.name ?? 'Triathlon Club Nantais'} · {clubInfo?.stats?.athletesCount ?? 12} athlètes · saison 2026
          </p>
        </div>
        {/* Toggle Espace coach / Aperçu athlète */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium">
              <Users className="w-4 h-4" /> Espace coach
            </button>
            <button
              onClick={() => navigate('/club/athlete')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 text-sm hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4" /> Aperçu athlète
            </button>
          </div>
          <button
            onClick={() => navigate('/')}
            aria-label="Retour au tableau de bord"
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowRightFromLine className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Athlètes suivis</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {clubInfo?.stats?.athletesCount ?? 12}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plans actifs</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {clubInfo?.stats?.activePlans ?? 9}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Séances faites · semaine</p>
          <p className="text-3xl font-bold text-emerald-600">
            {clubInfo?.stats?.weekCompletionPct ?? 84}%
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {clubInfo?.stats?.weekCompletedSessions ?? 71} / {clubInfo?.stats?.weekPlannedSessions ?? 84}
          </p>
        </div>
      </div>

      {/* Layout : roster (gauche) + assistant IA sticky (droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Roster */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Mon groupe</h2>
            <span className="text-xs text-gray-400">Trié par charge</span>
          </div>
          <div className="space-y-2">
            {roster?.map(athlete => (
              <button
                key={athlete.id}
                onClick={() => handleSelectAthlete(athlete)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-slate-800 text-left transition-all ${
                  selectedAthlete?.id === athlete.id
                    ? 'border-orange-300 dark:border-orange-700 shadow-[0_14px_32px_-16px_rgba(234,88,12,.35)]'
                    : 'border-gray-100 dark:border-slate-700 hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: getAvatarGradient(athlete.firstName) }}
                >
                  {athlete.firstName[0]}{athlete.lastName[0]}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {athlete.firstName} {athlete.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {athlete.level} ·{' '}
                    {athlete.nextCompetition
                      ? `${athlete.nextCompetition.name} · J-${athlete.nextCompetition.daysUntil}`
                      : 'Pas de compétition'}
                  </p>
                </div>

                {/* CTL */}
                <div className="text-center shrink-0">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">CTL</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {athlete.ctl ?? '—'}
                  </p>
                </div>

                {/* FORME */}
                <div className="text-center shrink-0">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">FORME</p>
                  <p
                    className={`text-lg font-bold ${
                      (athlete.tsb ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {athlete.tsb !== undefined
                      ? (athlete.tsb > 0 ? '+' : '') + athlete.tsb
                      : '—'}
                  </p>
                </div>

                {/* Badge statut */}
                {(() => {
                  const s = athlete.suggestionStatus
                  if (s === 'pending' || s === 'plan_to_validate') {
                    return (
                      <span className="flex items-center gap-1.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-dot" />
                        Plan à valider
                      </span>
                    )
                  }
                  if (s === 'sent') {
                    return (
                      <span className="flex items-center gap-1.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot" />
                        Plan envoyé
                      </span>
                    )
                  }
                  return (
                    <span className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 px-3 py-1.5 rounded-full shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      À assigner
                    </span>
                  )
                })()}
              </button>
            ))}
            {!roster?.length && (
              <p className="text-center py-10 text-sm text-gray-400">
                Aucun athlète dans votre club
              </p>
            )}
          </div>
        </div>

        {/* Panel IA sticky */}
        {selectedAthlete ? (
          <div
            className="sticky top-4 rounded-2xl border p-5 space-y-4"
            style={{
              background: 'linear-gradient(165deg,rgba(249,115,22,.09),#ffffff 42%)',
              borderColor: 'rgba(249,115,22,.28)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Assistant Plan IA
                </p>
                <p className="text-[11px] text-gray-500">Coche les ajustements à appliquer</p>
              </div>
            </div>

            {/* Card athlète sélectionné */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
              <div
                className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ background: getAvatarGradient(selectedAthlete.firstName) }}
              >
                {selectedAthlete.firstName[0]}{selectedAthlete.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedAthlete.firstName} {selectedAthlete.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedAthlete.nextCompetition?.name || ''} · forme{' '}
                  {(selectedAthlete.tsb ?? 0) > 0 ? '+' : ''}{selectedAthlete.tsb ?? 0}
                </p>
              </div>
            </div>

            {/* Suggestions ou bouton générer */}
            {suggestions.length > 0 ? (
              <div className="space-y-2">
                {suggestions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => toggleSuggestion(s.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      s.enabled
                        ? 'border-orange-200 dark:border-orange-800/40'
                        : 'border-gray-100 dark:border-slate-700'
                    }`}
                    style={s.enabled ? { background: 'rgba(249,115,22,.09)' } : {}}
                  >
                    {/* Toggle switch */}
                    <div
                      className="relative w-9 h-5 rounded-full shrink-0 mt-0.5 transition-colors"
                      style={{
                        background: s.enabled
                          ? 'linear-gradient(135deg,#FB923C,#EA580C)'
                          : '#D1D5DB',
                      }}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          s.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {s.title}
                        </p>
                        {s.delta && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                            {s.delta}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{s.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() =>
                  generateMutation.mutate({
                    athleteId: selectedAthlete.id,
                    planId: 0,
                    weekNumber: 6,
                  })
                }
                disabled={generateMutation.isPending}
                className="w-full py-2.5 rounded-xl border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                {generateMutation.isPending ? 'Génération...' : 'Générer les suggestions IA'}
              </button>
            )}

            {/* Mot du coach + actions */}
            {suggestions.length > 0 && (
              <>
                <textarea
                  value={coachNote}
                  onChange={e => setCoachNote(e.target.value)}
                  placeholder="Ajoute un message pour l'athlète…"
                  rows={3}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      generateMutation.mutate({
                        athleteId: selectedAthlete.id,
                        planId: 0,
                        weekNumber: 6,
                      })
                    }
                    disabled={generateMutation.isPending}
                    className="px-3 py-2 text-xs border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
                  >
                    Régénérer
                  </button>
                  <button
                    onClick={handleSendPlan}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-orange-500/30"
                    style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Valider & envoyer · {suggestions.filter(s => s.enabled).length} ajust.
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="sticky top-4 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gray-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Sélectionne un athlète pour générer des suggestions IA
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
