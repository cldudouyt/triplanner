import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Eye, Sparkles, Check, ArrowRightFromLine } from 'lucide-react'
import toast from 'react-hot-toast'
import { clubApi, type AiSuggestion } from '@/api/club.api'
import { useAuth } from '@/context/AuthContext'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'] as const

// Couleur du dot en-tête de colonne
const SPORT_DOT: Record<string, string> = {
  swim: 'bg-cyan-500',
  bike: 'bg-emerald-500',
  run: 'bg-orange-500',
  strength: 'bg-slate-400',
  mobility: 'bg-slate-400',
  rest: 'bg-gray-300',
}

// Bordure gauche de la carte (3px)
const SPORT_BORDER: Record<string, string> = {
  swim: 'border-cyan-500',
  bike: 'border-emerald-500',
  run: 'border-orange-500',
  strength: 'border-slate-300 dark:border-slate-600',
  mobility: 'border-slate-300 dark:border-slate-600',
}

// Fond de la carte
const SPORT_BG: Record<string, string> = {
  swim: 'bg-white dark:bg-slate-800',
  bike: 'bg-white dark:bg-slate-800',
  run: 'bg-white dark:bg-slate-800',
  strength: 'bg-white dark:bg-slate-800',
  mobility: 'bg-white dark:bg-slate-800',
}

// Couleur du label sport
const SPORT_TEXT: Record<string, string> = {
  swim: 'text-cyan-600 dark:text-cyan-300',
  bike: 'text-emerald-600 dark:text-emerald-300',
  run: 'text-orange-600 dark:text-orange-300',
  strength: 'text-slate-500',
  mobility: 'text-slate-500',
}

const SPORT_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
  strength: 'Prépa physique',
  mobility: 'Mobilité',
  rest: 'Repos',
}

function getSportLabel(sport: string): string {
  return SPORT_LABELS[sport?.toLowerCase()] ?? sport
}

function formatDuration(minutes?: number): string {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}'`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

function getAvatarGradient(name: string): string {
  const palettes = [
    'linear-gradient(135deg,#FB923C,#EA580C)',
    'linear-gradient(135deg,#94A3B8,#64748B)',
    'linear-gradient(135deg,#34D399,#059669)',
    'linear-gradient(135deg,#60A5FA,#3B82F6)',
    'linear-gradient(135deg,#A78BFA,#7C3AED)',
  ]
  return palettes[name.charCodeAt(0) % palettes.length]
}

interface WeekSession {
  id: number
  dayOfWeek: number
  sport: string
  type?: string
  title?: string
  sessionType?: string
  description?: string
  durationMin?: number
  duration?: number
  weekNumber?: number
  aiAdjusted?: boolean
  physPrep?: boolean
  physPrepLabel?: string
}

function getCurrentWeekSessions(plan: unknown): WeekSession[] {
  const p = plan as { sessions?: WeekSession[]; startDate?: string } | null
  if (!p?.sessions) return []
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return p.sessions
    .filter(s => {
      if (!p.startDate || !s.weekNumber || !s.dayOfWeek) return false
      const d = new Date(p.startDate)
      d.setDate(d.getDate() + ((s.weekNumber) - 1) * 7 + (s.dayOfWeek - 1))
      return d >= monday && d <= sunday
    })
    .sort((a, b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0))
}

export default function ClubAthletePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: planData, isLoading } = useQuery({
    queryKey: ['athlete-plan', user?.id],
    queryFn: () => clubApi.getAthletePlan(user!.id).then(r => r.data),
    enabled: !!user?.id,
  })

  const suggestion = planData?.currentSuggestion
  const aiSuggestions: AiSuggestion[] = suggestion
    ? Array.isArray(suggestion.suggestions)
      ? (suggestion.suggestions as AiSuggestion[])
      : (JSON.parse(suggestion.suggestions as unknown as string) as AiSuggestion[])
    : []

  const weekSessions = getCurrentWeekSessions(planData?.plan)

  const respondMutation = useMutation({
    mutationFn: (action: 'accept' | 'reject') =>
      clubApi.respondToPlan({ suggestionId: suggestion!.id, action }),
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['athlete-plan', user?.id] })
      if (action === 'accept') toast.success('Plan accepté !')
      else toast('Plan refusé.')
    },
  })

  if (isLoading) return <SkeletonDashboard />

  // Construire la map dayOfWeek (1-7) → sessions[]
  const sessionsByDay = new Map<number, WeekSession[]>()
  for (let i = 1; i <= 7; i++) sessionsByDay.set(i, [])
  weekSessions.forEach(s => {
    const arr = sessionsByDay.get(s.dayOfWeek) ?? []
    arr.push(s)
    sessionsByDay.set(s.dayOfWeek, arr)
  })

  return (
    <div className="animate-fade-in">
      {/* Header avec toggle */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mon entraînement</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.firstName} {user?.lastName} · Prépa Triathlon de Nantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => navigate('/club/coach')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 text-sm hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <Users className="w-4 h-4" /> Espace coach
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium">
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

      {/* Banner plan coach */}
      {suggestion && suggestion.status === 'sent' && (
        <div
          className="relative overflow-hidden rounded-2xl p-6 mb-6"
          style={{
            background: 'linear-gradient(135deg, #FB923C 0%, #F97316 52%, #EA580C 100%)',
            boxShadow: '0 22px 54px -26px rgba(234,88,12,.6)',
          }}
        >
          {/* Orbe décoratif */}
          <div className="absolute -top-16 -right-8 w-56 h-56 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-white bg-white/25 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Optimisé par IA
              </span>
              <span className="text-xs font-semibold text-white bg-white/25 px-3 py-1 rounded-full">
                ↔ Prépa physique incluse
              </span>
              <span className="text-xs text-white/60 ml-auto">Reçu il y a 2h</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Plan du coach · Semaine 6 / 12</h2>
              <button
                onClick={() => respondMutation.mutate('accept')}
                disabled={respondMutation.isPending}
                className="flex items-center gap-2 bg-white text-orange-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-50 shadow-lg transition-all shrink-0 disabled:opacity-70"
              >
                <Check className="w-4 h-4" />
                Accepter le plan
              </button>
            </div>
            {suggestion.coachNote && (
              <div className="flex items-center gap-3 mt-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: user?.firstName ? getAvatarGradient(user.firstName) : 'rgba(255,255,255,0.3)' }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <p className="text-sm text-white/90 italic">« {suggestion.coachNote} »</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pas de plan envoyé */}
      {(!suggestion || suggestion.status !== 'sent') && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-8 mb-6 text-center">
          <Sparkles className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ton coach n'a pas encore envoyé de plan pour cette semaine.
          </p>
        </div>
      )}

      {/* Section Ma semaine */}
      <div>
        {/* Header + légende */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Ma semaine</h2>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Natation
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Vélo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Course
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-slate-400" />
              Prépa physique
            </span>
          </div>
        </div>

        {/* Grille 7 colonnes */}
        <div className="grid grid-cols-7 gap-3">
          {WEEK_DAYS.map((abbr, idx) => {
            const dayNumber = idx + 1
            const daySessions = sessionsByDay.get(dayNumber) ?? []

            // Session principale = premier sport triathlon (swim/bike/run) ou première session
            const mainSession =
              daySessions.find(
                s => s.sport !== 'strength' && s.sport !== 'mobility' && s.type !== 'strength' && s.type !== 'mobility'
              ) ?? daySessions[0]

            // Sessions prépa physique
            const physSessions = daySessions.filter(
              s => s !== mainSession && (s.sport === 'strength' || s.sport === 'mobility' || s.type === 'strength' || s.type === 'mobility')
            )

            const sport = (mainSession?.sport || mainSession?.type || 'rest').toLowerCase()
            const isRest = !mainSession || sport === 'rest'
            const dotColor = SPORT_DOT[sport] ?? 'bg-gray-200'
            const borderColor = isRest ? 'border-gray-200 dark:border-slate-600' : (SPORT_BORDER[sport] ?? 'border-gray-200')
            const bgColor = isRest ? 'bg-white dark:bg-slate-800' : (SPORT_BG[sport] ?? 'bg-white dark:bg-slate-800')
            const textColor = SPORT_TEXT[sport] ?? 'text-gray-600'

            return (
              <div key={abbr} className="flex flex-col gap-2">
                {/* En-tête colonne */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                  <span className="text-xs font-semibold uppercase text-gray-400 tracking-wide">
                    {abbr}
                  </span>
                </div>

                {/* Carte principale */}
                {!isRest ? (
                  <div
                    className={`rounded-xl p-3 border-l-[3px] ${borderColor} ${bgColor}`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${textColor}`}>
                      {getSportLabel(sport)}
                    </p>
                    {(mainSession?.sessionType || mainSession?.title) && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                        {mainSession.sessionType || mainSession.title}
                      </p>
                    )}
                    <p className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 mt-1">
                      {formatDuration(mainSession?.durationMin ?? mainSession?.duration)}
                    </p>
                    {mainSession?.aiAdjusted && (
                      <span
                        className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-1"
                        style={{ background: 'rgba(249,115,22,.16)', color: '#C2410C' }}
                      >
                        ✦ Ajusté IA
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl p-3 border border-dashed border-gray-200 dark:border-slate-700">
                    <p className="text-xs text-gray-400">Repos</p>
                    {mainSession?.sessionType && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{mainSession.sessionType}</p>
                    )}
                    <p className="text-xs font-mono text-gray-300 dark:text-gray-600 mt-1">—</p>
                  </div>
                )}

                {/* Pills prépa physique */}
                {physSessions.map((s, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  >
                    {s.sessionType || s.title || getSportLabel(s.sport || s.type || '')}
                    {(s.durationMin ?? s.duration) ? ` ${formatDuration(s.durationMin ?? s.duration)}` : ''}
                  </span>
                ))}

                {/* Pas de session du tout */}
                {daySessions.length === 0 && (
                  <div className="rounded-xl p-3 border border-dashed border-gray-200 dark:border-slate-700">
                    <p className="text-xs text-gray-400">Repos</p>
                    <p className="text-xs font-mono text-gray-300 dark:text-gray-600 mt-1">—</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Section "Ce que l'IA a ajusté" */}
      {aiSuggestions.length > 0 && (
        <div
          className="mt-6 rounded-2xl border p-5"
          style={{
            background: 'linear-gradient(160deg, rgba(249,115,22,.07), #FFFFFF 45%)',
            borderColor: 'rgba(249,115,22,.24)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Ce que l'IA a ajusté
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiSuggestions.map(s => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {s.title}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.enabled
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {s.enabled ? 'Appliqué' : 'Ignoré'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.why}</p>
                {s.delta && (
                  <p className="text-xs font-semibold mt-1" style={{ color: '#EA580C' }}>
                    {s.delta}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
