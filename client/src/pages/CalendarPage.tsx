import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  format,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Search, Bell } from 'lucide-react'
import api from '@/api/client'
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

const SPORT_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  swim: {
    border: 'border-cyan-500',
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-cyan-600 dark:text-cyan-300',
  },
  bike: {
    border: 'border-emerald-500',
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-emerald-600 dark:text-emerald-300',
  },
  run: {
    border: 'border-orange-500',
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-orange-600 dark:text-orange-300',
  },
  strength: {
    border: 'border-slate-300 dark:border-slate-600',
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-slate-500 dark:text-slate-400',
  },
  mobility: {
    border: 'border-slate-300 dark:border-slate-600',
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-slate-500 dark:text-slate-400',
  },
  brick: {
    border: 'border-orange-500',
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-orange-600 dark:text-orange-300',
  },
  rest: {
    border: 'border-slate-200 dark:border-slate-600',
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-slate-400 dark:text-slate-500',
  },
}

function getSportStyle(type: string): { border: string; bg: string; text: string } {
  return (
    SPORT_STYLE[type] || {
      border: 'border-gray-200 dark:border-slate-600',
      bg: 'bg-white dark:bg-slate-800',
      text: 'text-gray-600 dark:text-gray-300',
    }
  )
}

function formatDuration(val?: number | string | null): string {
  if (!val) return '—'
  const mins = typeof val === 'string' ? parseInt(val) : val
  if (isNaN(mins)) return String(val)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
}

function getSessionDate(s: any, plan: any): Date | null {
  if (s.date || s.scheduledDate) return new Date(s.date || s.scheduledDate)
  if (plan?.startDate && s.weekNumber && s.dayOfWeek) {
    const d = new Date(plan.startDate)
    d.setDate(d.getDate() + (s.weekNumber - 1) * 7 + (s.dayOfWeek - 1))
    return d
  }
  return null
}

function getSessionsForDay(day: Date, sessions: any[], plan: any): any[] {
  return sessions.filter((s: any) => {
    const d = getSessionDate(s, plan)
    return d !== null && isSameDay(d, day)
  })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const { data: activePlan, isLoading } = useQuery({
    queryKey: ['active-plan'],
    queryFn: () =>
      api
        .get('/training-plans/active')
        .then(r => r.data)
        .catch(() => null),
  })

  if (isLoading) return <SkeletonDashboard />

  const sessions: any[] = activePlan?.sessions || []

  // Calcul label semaine dans le plan
  const weekLabel: string | null = activePlan?.startDate
    ? (() => {
        const diffDays = Math.floor(
          (weekStart.getTime() - new Date(activePlan.startDate).getTime()) / 86400000,
        )
        const wNum = Math.floor(diffDays / 7) + 1
        const totalW = activePlan.totalWeeks || activePlan.durationWeeks || 99
        if (wNum < 1 || wNum > totalW) return null
        return `Semaine ${wNum} / ${activePlan.totalWeeks || activePlan.durationWeeks}`
      })()
    : null

  // Volume semaine
  const weekMins = weekDays
    .flatMap(d => getSessionsForDay(d, sessions, activePlan))
    .reduce((s, sess) => s + (sess.durationMin || sess.duration || 0), 0)
  const weekVolume =
    weekMins > 0
      ? `${Math.floor(weekMins / 60)}h${weekMins % 60 > 0 ? String(weekMins % 60).padStart(2, '0') : ''}`
      : '—'

  return (
    <div className="animate-fade-in max-w-6xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendrier</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Planning d'entraînement
            {activePlan?.name ? ` · prépa ${activePlan.name}` : ''}
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

      {/* ── Barre navigation semaine ── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 px-5 py-3 mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart(d => subWeeks(d, 1))}
            aria-label="Semaine précédente"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {format(weekStart, 'd', { locale: fr })} –{' '}
            {format(weekEnd, 'd MMM yyyy', { locale: fr })}
          </span>
          <button
            onClick={() => setWeekStart(d => addWeeks(d, 1))}
            aria-label="Semaine suivante"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
          {weekLabel && (
            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-sm font-medium">
              {weekLabel}
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Volume prévu :{' '}
          <span className="text-orange-600">{weekVolume}</span>
        </span>
      </div>

      {/* ── Grille 7 colonnes (scroll horizontal sur mobile) ── */}
      <div className="overflow-x-auto -mx-1 px-1">
      <div className="grid grid-cols-7 gap-3 min-w-[600px]">
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, new Date())
          const daySessions = getSessionsForDay(day, sessions, activePlan)

          return (
            <div key={idx} className="flex flex-col gap-2 min-h-[300px]">
              {/* En-tête colonne */}
              <div className="text-center pb-2">
                <p className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 tracking-wide">
                  {format(day, 'EEE', { locale: fr })}
                </p>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    isToday ? 'text-orange-500' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {format(day, 'd')}
                </p>
              </div>

              {/* Cartes séances */}
              {daySessions.map((session: any) => {
                const style = getSportStyle(session.type)
                return (
                  <div
                    key={session.id}
                    className={`rounded-xl p-3 border-l-[3px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${style.border} ${style.bg}`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${style.text}`}>
                      {getSportLabel(session.type)}
                    </p>
                    {(session.sessionType || session.title) && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                        {session.sessionType || session.title}
                      </p>
                    )}
                    {session.coachName && (
                      <p className="text-[10px] text-gray-400 mt-0.5">({session.coachName})</p>
                    )}
                    <p className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 mt-1.5">
                      {formatDuration(session.durationMin || session.duration)}
                    </p>
                  </div>
                )
              })}

              {/* Zone vide */}
              {daySessions.length === 0 && (
                <div className="flex-1 min-h-[80px] rounded-xl border-2 border-dashed border-gray-100 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-orange-200 dark:hover:border-orange-800 transition-colors group">
                  <Plus className="w-4 h-4 text-gray-200 dark:text-slate-600 group-hover:text-orange-300 transition-colors" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
