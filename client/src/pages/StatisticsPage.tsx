import { useQuery } from '@tanstack/react-query'
import { Search, Bell } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/api/client'
import { SkeletonStatCard } from '@/components/ui/Skeleton'

interface StatsSummary {
  totalHours?: number
  totalDistance?: number
  totalSessions?: number
  elevationGain?: number
}

interface WeeklyVolumePoint {
  week: number
  swim: number
  bike: number
  run: number
}

interface DisciplineSplit {
  bikePct?: number
  bikeHours?: number
  runPct?: number
  runHours?: number
  swimPct?: number
  swimHours?: number
}

const STATS_CARDS = [
  { key: 'totalHours', label: 'Volume total', unit: 'h', fallback: 118, delta: '↑ 9% vs cycle préc.' },
  { key: 'totalDistance', label: 'Distance', unit: 'km', fallback: 1240, delta: '↑ 12%' },
  { key: 'totalSessions', label: 'Séances', unit: '', fallback: 68, delta: '↑ 4' },
  { key: 'elevationGain', label: 'Dénivelé vélo', unit: 'm', fallback: 9850, delta: '↑ 1 200 m' },
] as const

export default function StatisticsPage() {
  const { data: stats, isLoading: loadingStats } = useQuery<StatsSummary | null>({
    queryKey: ['stats-summary'],
    queryFn: () =>
      api.get('/statistics/summary?weeks=12').then(r => r.data).catch(() => null),
  })

  const { data: weeklyData, isLoading: loadingWeekly } = useQuery<WeeklyVolumePoint[]>({
    queryKey: ['weekly-volume'],
    queryFn: () =>
      api.get('/statistics/weekly-volume?weeks=12').then(r => r.data).catch(() => []),
  })

  const { data: split, isLoading: loadingSplit } = useQuery<DisciplineSplit | null>({
    queryKey: ['discipline-split'],
    queryFn: () =>
      api.get('/statistics/discipline-split?weeks=12').then(r => r.data).catch(() => null),
  })

  const isLoading = loadingStats || loadingWeekly || loadingSplit

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <div className="h-8 w-40 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-56 bg-gray-100 dark:bg-slate-700/60 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Statistiques</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            12 dernières semaines · toutes disciplines
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
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS_CARDS.map(({ key, label, unit, fallback, delta }) => {
          const val = stats?.[key as keyof StatsSummary] ?? fallback
          const formatted =
            typeof val === 'number' && val >= 1000
              ? val.toLocaleString('fr-FR')
              : String(val)
          return (
            <div
              key={key}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</p>
              <p className="text-[28px] font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-none">
                {formatted}
                {unit ? (
                  <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>
                ) : null}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">{delta}</p>
            </div>
          )
        })}
      </div>

      {/* Layout 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Graphe stacked bar — col 2/3 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Volume hebdomadaire</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                Nat.
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Vélo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                C.À.P
              </span>
            </div>
          </div>
          {weeklyData?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} barSize={18} barCategoryGap="30%">
                <XAxis
                  dataKey="week"
                  tickFormatter={(v: number) => `S${v}`}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}h`}
                />
                <Tooltip formatter={(v: unknown) => `${v}h`} />
                <Bar dataKey="swim" stackId="a" fill="#06B6D4" />
                <Bar dataKey="bike" stackId="a" fill="#10B981" />
                <Bar dataKey="run" stackId="a" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs text-gray-400 dark:text-slate-500">
              Pas assez de données
            </div>
          )}
        </div>

        {/* Répartition — col 1/3 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Répartition</h3>
          <div className="space-y-5">
            {[
              {
                label: 'Vélo',
                pct: split?.bikePct ?? 52,
                hours: split?.bikeHours ?? 61,
                detail: 'sorties + home-trainer',
                color: '#059669',
              },
              {
                label: 'Course à pied',
                pct: split?.runPct ?? 30,
                hours: split?.runHours ?? 35,
                detail: '410 km',
                color: '#EA580C',
              },
              {
                label: 'Natation',
                pct: split?.swimPct ?? 18,
                hours: split?.swimHours ?? 22,
                detail: '64 km',
                color: '#0891B2',
              },
            ].map(({ label, pct, hours, detail, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {hours} h · {detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
