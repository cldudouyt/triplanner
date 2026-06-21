import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Bell, Search, Sparkles, Check } from 'lucide-react'
import api from '@/api/client'
import { SPORT_COLORS } from '@/utils/constants'
import { useAuth } from '@/context/AuthContext'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

// ── Helpers ──────────────────────────────────────────────────────────────────

const SPORT_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
  strength: 'Renforcement',
  brick: 'Enchaînement',
  rest: 'Repos',
  mobility: 'Mobilité',
}

function getSportLabel(type: string): string {
  return SPORT_LABELS[type] || type
}

function getSportColor(type: string): string {
  return SPORT_COLORS[type as keyof typeof SPORT_COLORS]?.color || '#94a3b8'
}

const DAY_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']

function getDayShort(session: any, activePlan: any): string {
  if (session.date || session.scheduledDate) {
    return DAY_SHORT[new Date(session.date || session.scheduledDate).getDay()] ?? ''
  }
  if (activePlan?.startDate && session.dayOfWeek) {
    const d = new Date(activePlan.startDate)
    d.setDate(d.getDate() + (session.weekNumber - 1) * 7 + (session.dayOfWeek - 1))
    return DAY_SHORT[d.getDay()] ?? ''
  }
  return ''
}

function formatDuration(val?: number | string | null): string {
  if (!val) return '—'
  const mins = typeof val === 'string' ? parseInt(val) : val
  if (isNaN(mins)) return String(val)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
}

function isSessionToday(session: any, activePlan: any): boolean {
  let d: Date
  if (session.date || session.scheduledDate) {
    d = new Date(session.date || session.scheduledDate)
  } else if (activePlan?.startDate && session.dayOfWeek) {
    d = new Date(activePlan.startDate)
    d.setDate(d.getDate() + (session.weekNumber - 1) * 7 + (session.dayOfWeek - 1))
  } else {
    return false
  }
  return d.toDateString() === new Date().toDateString()
}

function formatSessionDate(session: any, activePlan: any): string {
  let d: Date
  if (session.date || session.scheduledDate) {
    d = new Date(session.date || session.scheduledDate)
  } else if (activePlan?.startDate && session.dayOfWeek) {
    d = new Date(activePlan.startDate)
    d.setDate(d.getDate() + (session.weekNumber - 1) * 7 + (session.dayOfWeek - 1))
  } else {
    return ''
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function parseBlocks(desc?: string | null): { title: string; duration: string; body: string }[] {
  if (!desc) return []
  return desc
    .split(/\n\n+/)
    .filter(Boolean)
    .map(p => {
      const lines = p.trim().split('\n')
      const firstLine = lines[0]
      const match = firstLine.match(/^(.+?)\s+(\d+\s*min)$/i)
      if (match) {
        return { title: match[1], duration: match[2], body: lines.slice(1).join('\n').trim() }
      }
      return { title: firstLine, duration: '', body: lines.slice(1).join('\n').trim() }
    })
}

function getWeekSessions(plan: any): any[] {
  if (!plan?.sessions) return []
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return plan.sessions
    .filter((s: any) => {
      let d: Date
      if (s.date || s.scheduledDate) {
        d = new Date(s.date || s.scheduledDate)
      } else if (plan.startDate && s.dayOfWeek) {
        d = new Date(plan.startDate)
        d.setDate(d.getDate() + (s.weekNumber - 1) * 7 + (s.dayOfWeek - 1))
      } else {
        return false
      }
      return d >= monday && d <= sunday
    })
    .sort((a: any, b: any) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0))
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TrainingPlansPage() {
  const { user } = useAuth()
  const [selected, setSelected] = useState<any | null>(null)

  const { data: activePlan, isLoading } = useQuery({
    queryKey: ['active-plan'],
    queryFn: () =>
      api
        .get('/training-plans/active')
        .then(r => r.data)
        .catch(() => null),
  })

  const { data: coachPlan } = useQuery({
    queryKey: ['coach-plan', user?.id],
    queryFn: () =>
      api
        .get(`/club/plan/${user!.id}/current`)
        .then(r => r.data?.currentSuggestion ?? null)
        .catch(() => null),
    enabled: !!user?.id,
  })

  const weekSessions = getWeekSessions(activePlan)

  // Auto-select first session when week sessions load
  useEffect(() => {
    if (!selected && weekSessions.length) {
      setSelected(weekSessions[0])
    }
  }, [weekSessions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <SkeletonDashboard />

  const currentWeek = activePlan?.startDate
    ? Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(activePlan.startDate).getTime()) / (7 * 24 * 3600 * 1000),
        ),
      )
    : 1
  const totalWeeks = activePlan?.durationWeeks || activePlan?.totalWeeks || 0

  // Volume labels: tri vs prépa (strength)
  const triMins = weekSessions
    .filter((s: any) => s.type !== 'strength')
    .reduce((sum: number, s: any) => sum + (s.durationMin || s.duration || 0), 0)
  const prepMins = weekSessions
    .filter((s: any) => s.type === 'strength')
    .reduce((sum: number, s: any) => sum + (s.durationMin || s.duration || 0), 0)
  const volumeTri = formatDuration(triMins || undefined)
  const volumePrep = prepMins > 0 ? formatDuration(prepMins) : null

  const showCoachBanner = coachPlan?.status === 'sent'

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mon plan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activePlan
              ? `Semaine ${currentWeek} / ${totalWeeks} · optimisé par le coach et l'IA`
              : 'Aucun plan actif'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              placeholder="Rechercher une séance..."
              aria-label="Rechercher une séance"
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 focus:outline-none w-52"
            />
          </div>
          <button
            aria-label="Notifications"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/30"
            style={{ background: 'linear-gradient(135deg, #FB923C, #EA580C)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Séance</span>
          </button>
        </div>
      </div>

      {/* ── Coach banner ── */}
      {showCoachBanner && (
        <div
          className="relative overflow-hidden rounded-2xl p-6 mb-6"
          style={{
            background: 'linear-gradient(135deg,#FB923C 0%,#F97316 52%,#EA580C 100%)',
            boxShadow: '0 22px 54px -26px rgba(234,88,12,.6)',
          }}
        >
          {/* Orbe déco */}
          <div className="absolute -top-16 -right-8 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative">
            {/* Badges + timestamp */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3" /> Optimisé par IA
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full">
                ↔ Prépa physique incluse
              </span>
              <span className="ml-auto text-xs text-white/60">Reçu il y a 2h</span>
            </div>

            {/* Titre + bouton accepter */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-white">
                Plan du coach · Semaine {activePlan?.currentWeek ?? currentWeek} /{' '}
                {activePlan?.totalWeeks ?? totalWeeks}
              </h2>
              <button className="flex items-center gap-2 bg-white text-orange-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-50 shadow-lg transition-all text-sm">
                <Check className="w-4 h-4" /> Accepter le plan
              </button>
            </div>

            {/* Citation coach */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold flex-none">
                TM
              </div>
              <p className="text-sm text-white/90 italic">
                «{' '}
                {coachPlan.coachNote ||
                  'Belle régularité Léa. On allège un peu le vélo et on cale le renfo avec Julie, focus technique natation.'}{' '}
                »
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2-column layout ── */}
      {activePlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Col gauche — liste séances */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cette semaine</h3>
              <span className="text-xs text-gray-500">
                {volumeTri} tri{volumePrep ? ` · ${volumePrep} prépa` : ''}
              </span>
            </div>

            {weekSessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                Aucune séance cette semaine
              </p>
            ) : (
              weekSessions.map((session: any) => (
                <button
                  key={session.id}
                  onClick={() => setSelected(session)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all border-l-[3px] ${
                    selected?.id === session.id
                      ? 'border-orange-500 bg-orange-500/8 dark:bg-orange-900/10'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-400 w-8 uppercase shrink-0">
                    {getDayShort(session, activePlan)}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getSportColor(session.type) }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getSportLabel(session.type)}
                  </span>
                  {session.aiAdjusted && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                      IA
                    </span>
                  )}
                  <span className="text-sm font-mono text-gray-500 dark:text-gray-400 shrink-0">
                    {formatDuration(session.durationMin || session.duration)}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Col droite — détail séance */}
          {selected ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: getSportColor(selected.type) }}
                    >
                      {getSportLabel(selected.type)}
                    </span>
                    {isSessionToday(selected, activePlan) && (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatSessionDate(selected, activePlan)}
                    {(selected.sessionType || selected.title)
                      ? ` · ${selected.sessionType || selected.title}`
                      : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">
                    {formatDuration(selected.durationMin || selected.duration)}
                  </p>
                  <p className="text-xs text-gray-400">durée</p>
                </div>
              </div>

              {selected.intensity && (
                <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 mb-4">
                  {selected.intensity}
                </span>
              )}

              <div className="space-y-3">
                {parseBlocks(selected.description).map((block, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {block.title}
                      </p>
                      {block.duration && (
                        <p className="text-xs text-gray-400 shrink-0">{block.duration}</p>
                      )}
                    </div>
                    {block.body && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                        {block.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all">
                Marquer comme faite
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 dark:border-slate-700 text-gray-400 dark:text-gray-600 text-sm min-h-[200px]">
              Sélectionnez une séance pour voir les détails
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Aucun plan d'entraînement actif.</p>
        </div>
      )}
    </div>
  )
}
