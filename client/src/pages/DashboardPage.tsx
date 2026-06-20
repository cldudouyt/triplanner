import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  Plus,
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  Heart,
  AlertTriangle,
} from 'lucide-react'
import { statisticsApi } from '@/api/statistics.api'
import { trainingPlansApi } from '@/api/trainingPlans.api'
import { goalsApi } from '@/api/goals.api'
import { wellnessApi } from '@/api/wellness.api'
import { useAuth } from '@/context/AuthContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { OnboardingModal, useOnboarding } from '@/components/onboarding'
import RaceDayBanner from '@/components/dashboard/RaceDayBanner'
import clsx from 'clsx'
import api from '@/api/client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`
}

// ─── Fallback mock data (maquette) ────────────────────────────────────────────

const FALLBACK_GOALS = [
  { id: 'f1', label: 'Prépa Tri de Nantes Sem. 6/12', percentage: 50, currentValue: '6', targetValue: '12', unit: 'sem.', color: 'orange' as const },
  { id: 'f2', label: 'Natation — technique', percentage: 68, currentValue: '68', targetValue: '100', unit: '%', color: 'cyan' as const },
  { id: 'f3', label: 'Seuil course', percentage: 85, currentValue: '85', targetValue: '100', unit: '%', color: 'orange' as const },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const { showOnboarding, closeOnboarding } = useOnboarding()

  // ── Data fetching ───────────────────────────────────────────────────────────
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/statistics/dashboard').then(r => r.data).catch(() => null),
  })

  const { data: overallStats } = useQuery({
    queryKey: ['stats-overall'],
    queryFn: () => statisticsApi.getOverallStats().then(r => r.data).catch(() => null),
  })

  const { data: activePlanData } = useQuery({
    queryKey: ['active-plan'],
    queryFn: () => api.get('/training-plans/active').then(r => r.data).catch(() => null),
  })

  const { data: plansData } = useQuery({
    queryKey: ['training-plans'],
    queryFn: () => trainingPlansApi.list().then(r => r.data),
  })

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then(r => Array.isArray(r.data) ? r.data : r.data?.data ?? []).catch(() => []),
  })

  const { data: loadData } = useQuery({
    queryKey: ['training-load'],
    queryFn: () => api.get('/statistics/training-load').then(r => r.data).catch(() => []),
  })

  const { data: wellnessAlerts } = useQuery({
    queryKey: ['wellness', 'alerts'],
    queryFn: () => wellnessApi.getAlerts().then(r => r.data),
  })

  // ── Computed values ─────────────────────────────────────────────────────────

  // Training load (CTL/ATL/TSB)
  const trainingLoad = (dashboardData as any)?.trainingLoad
  const latestLoad = Array.isArray(trainingLoad) ? trainingLoad[trainingLoad.length - 1] : null
  const ctl = Math.round(latestLoad?.ctl ?? (dashboardData as any)?.ctl ?? 78)
  const tsb = Math.round(latestLoad?.tsb ?? (dashboardData as any)?.tsb ?? 12)

  const prevLoad = Array.isArray(trainingLoad) && trainingLoad.length > 7
    ? trainingLoad[trainingLoad.length - 8]
    : null
  const ctlDelta = prevLoad ? Math.round(ctl - prevLoad.ctl) : 6 // fallback from maquette

  // Volume
  const weekVolume = dashboardData?.weekly?.[dashboardData.weekly.length - 1]?.total?.duration ?? 572 // 9h32 = 572min
  const prevWeekVolume = dashboardData?.weekly && dashboardData.weekly.length > 1
    ? dashboardData.weekly[dashboardData.weekly.length - 2]?.total?.duration ?? 500
    : 500
  const volumeDeltaMin = weekVolume - prevWeekVolume

  // Sessions — weekly count from active plan sessions
  const weekMonday = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d
  })()
  const weekEnd = new Date(weekMonday.getTime() + 7 * 86400000)
  const allPlanSessions: any[] = activePlanData?.sessions ?? []
  const weekSessions = allPlanSessions.filter((s: any) => {
    let date: Date | null = null
    if (s.date || s.scheduledDate) date = new Date(s.date || s.scheduledDate)
    else if (activePlanData?.startDate && s.weekNumber && s.dayOfWeek) {
      date = new Date(activePlanData.startDate)
      date.setDate(date.getDate() + (s.weekNumber - 1) * 7 + (s.dayOfWeek - 1))
    }
    return date !== null && date >= weekMonday && date < weekEnd
  })
  const completedSessions = weekSessions.length > 0
    ? weekSessions.filter((s: any) => s.completed).length
    : 5
  const plannedSessions = weekSessions.length > 0 ? weekSessions.length : 6

  // TSB label / state
  const tsbIsGood = tsb > 5

  // Active plan (fallback to plansData)
  const plans = plansData?.data ?? []
  const activePlan =
    activePlanData ??
    plans.find(p => p.startDate && (!p.endDate || new Date(p.endDate) >= new Date())) ??
    plans[0] ??
    null

  const currentWeek = activePlan?.startDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(activePlan.startDate).getTime()) / (7 * 24 * 3600 * 1000)))
    : 1
  const totalWeeks = activePlan?.durationWeeks ?? 0

  // Header subtitle
  const todayStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const todayCapitalized = todayStr.charAt(0).toUpperCase() + todayStr.slice(1)

  const subtitleParts: string[] = [todayCapitalized]
  if (activePlan) {
    subtitleParts.push(`Semaine ${currentWeek} / ${totalWeeks} — ${activePlan.name}`)
  }
  const subtitle = subtitleParts.join(' · ')

  // Chart data: last 42 days
  const rawLoad = loadData ?? []
  const chartData = (Array.isArray(rawLoad) ? rawLoad : []).slice(-42).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    CTL: Math.round(d.ctl ?? 0),
    ATL: Math.round(d.atl ?? 0),
    TSB: Math.round(d.tsb ?? 0),
  }))

  // Goals
  const displayGoals = Array.isArray(goals) && goals.length > 0 ? goals : FALLBACK_GOALS

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        onComplete={(data) => {
          console.log('Onboarding completed:', data)
        }}
      />

      <RaceDayBanner />

      {/* Wellness alerts */}
      {wellnessAlerts && wellnessAlerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {wellnessAlerts.map((alert, i) => (
            <div
              key={i}
              className={clsx(
                'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm',
                alert.severity === 'danger'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
              )}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Rechercher une séance..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 focus:outline-none w-52 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <button className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <Link
            to="/calendar"
            className="flex items-center gap-2 bg-gradient-to-br from-orange-400 to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Séance
          </Link>
        </div>
      </div>

      {/* ── Streak badge ── */}
      {(() => {
        // Use API streak if available, otherwise count from training load data
        const streak = overallStats?.currentStreak ?? 0
        if (streak <= 0) return null
        return (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              {streak} jour{streak > 1 ? 's' : ''} de suite
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">· continue comme ça !</span>
          </div>
        )
      })()}

      {/* ── 4 StatCards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Card 1 — Fitness (CTL) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Sparkles className="w-[18px] h-[18px] text-orange-500" />
            </div>
            <span
              className={clsx(
                'text-xs font-medium',
                ctlDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
              )}
            >
              {ctlDelta >= 0 ? '↑' : '↓'} {Math.abs(ctlDelta)}
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
            Fitness (CTL)
          </p>
          <p className="text-[25px] font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            {ctl}{' '}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">TSS/j</span>
          </p>
        </div>

        {/* Card 2 — Volume */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <Clock className="w-[18px] h-[18px] text-cyan-500" />
            </div>
            <span
              className={clsx(
                'text-xs font-medium',
                volumeDeltaMin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
              )}
            >
              {volumeDeltaMin >= 0 ? '↑' : '↓'} {formatDuration(Math.abs(volumeDeltaMin))}
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
            Volume
          </p>
          <p className="text-[25px] font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            {formatDuration(weekVolume)}
          </p>
        </div>

        {/* Card 3 — Séances */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-[18px] h-[18px] text-teal-500" />
            </div>
            <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
              cette sem.
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
            Séances
          </p>
          <p className="text-[25px] font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            {completedSessions}{' '}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">/ {plannedSessions}</span>
          </p>
        </div>

        {/* Card 4 — Forme (TSB) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
              <Heart className="w-[18px] h-[18px] text-rose-400" />
            </div>
            {tsbIsGood ? (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                frais
              </span>
            ) : (
              <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {tsb < -10 ? 'fatigué' : 'stable'}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
            Forme (TSB)
          </p>
          <p
            className={clsx(
              'text-[25px] font-extrabold tracking-tight',
              tsb < -15 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-gray-100',
            )}
          >
            {tsb > 0 ? '+' : ''}{tsb}
          </p>
        </div>
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left 2/3 — Charge d'entraînement */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Charge d'entraînement
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                CTL
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                ATL
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                TSB
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            42 derniers jours · TSS quotidien
          </p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ctlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="atlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tsbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="CTL" stroke="#f97316" strokeWidth={2} fill="url(#ctlGrad)" dot={false} />
                <Area type="monotone" dataKey="ATL" stroke="#06b6d4" strokeWidth={2} fill="url(#atlGrad)" dot={false} />
                <Area type="monotone" dataKey="TSB" stroke="#10b981" strokeWidth={2} fill="url(#tsbGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Aucune donnée disponible</p>
            </div>
          )}
        </div>

        {/* Right 1/3 — Objectifs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Objectifs</h3>
            <Link
              to="/goals"
              className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
            >
              Voir tout →
            </Link>
          </div>

          <div className="space-y-4">
            {displayGoals.slice(0, 5).map((goal: any) => {
              const pct = Math.min(goal.percentage ?? 0, 100)
              const label = goal.label ?? `${goal.sport} ${goal.type}`
              const detail = goal.currentValue !== undefined && goal.targetValue !== undefined
                ? `${goal.currentValue} / ${goal.targetValue} ${goal.unit ?? ''}`
                : null
              return (
                <div key={goal.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
                      {label}
                    </span>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400 shrink-0">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <ProgressBar value={pct} max={100} color="orange" size="sm" />
                  {detail && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{detail}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
