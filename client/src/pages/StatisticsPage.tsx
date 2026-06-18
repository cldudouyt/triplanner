import { useQuery } from '@tanstack/react-query'
import { statisticsApi, type WeeklyStats, type SportDistribution, type TrainingLoadPoint } from '@/api/statistics.api'
import { wellnessApi, type WellnessLog } from '@/api/wellness.api'
import { Activity, TrendingUp, Target, Flame, Clock, MapPin, Zap, Heart } from 'lucide-react'
import { SPORT_COLORS as SPORT_PALETTE } from '@/utils/constants'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonStatCard, Skeleton } from '@/components/ui/Skeleton'

const SPORT_COLORS: Record<string, string> = {
  swim: SPORT_PALETTE.swim.bg,
  bike: SPORT_PALETTE.bike.bg,
  run: SPORT_PALETTE.run.bg,
  other: 'bg-gray-500',
}

const SPORT_HEX: Record<string, string> = {
  swim: SPORT_PALETTE.swim.color,
  bike: SPORT_PALETTE.bike.color,
  run: SPORT_PALETTE.run.color,
  other: '#6b7280',
}

const SPORT_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
  other: 'Autre',
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

function WeeklyChart({ data }: { data: WeeklyStats[] }) {
  const maxDuration = Math.max(...data.map(w => w.total.duration), 1)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Volume hebdomadaire</h3>
      <div className="flex items-end gap-2 h-48">
        {data.map((week) => {
          const height = (week.total.duration / maxDuration) * 100
          return (
            <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                <div
                  className="w-full rounded-t flex flex-col justify-end overflow-hidden"
                  style={{ height: `${height}%` }}
                >
                  {week.run.duration > 0 && (
                    <div
                      style={{ height: `${(week.run.duration / week.total.duration) * 100}%`, backgroundColor: SPORT_HEX.run }}
                    />
                  )}
                  {week.bike.duration > 0 && (
                    <div
                      style={{ height: `${(week.bike.duration / week.total.duration) * 100}%`, backgroundColor: SPORT_HEX.bike }}
                    />
                  )}
                  {week.swim.duration > 0 && (
                    <div
                      style={{ height: `${(week.swim.duration / week.total.duration) * 100}%`, backgroundColor: SPORT_HEX.swim }}
                    />
                  )}
                  {week.other.duration > 0 && (
                    <div
                      className="bg-gray-500"
                      style={{ height: `${(week.other.duration / week.total.duration) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(week.weekStart).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-4 justify-center">
        {Object.entries(SPORT_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SPORT_HEX[key] || '#6b7280' }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DistributionChart({ data }: { data: SportDistribution[] }) {
  const total = data.reduce((sum, d) => sum + d.duration, 0)
  let currentAngle = 0

  const segments = data.map((d) => {
    const angle = (d.duration / total) * 360
    const startAngle = currentAngle
    currentAngle += angle
    return { ...d, startAngle, angle }
  })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Répartition par sport</h3>
      <div className="flex items-center gap-8">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {segments.map((segment, i) => {
              const radius = 40
              const circumference = 2 * Math.PI * radius
              const strokeDasharray = (segment.angle / 360) * circumference
              const strokeDashoffset = -(segment.startAngle / 360) * circumference

              return (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={SPORT_HEX[segment.type] || '#6b7280'}
                  strokeWidth="20"
                  strokeDasharray={`${strokeDasharray} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                />
              )
            })}
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: SPORT_HEX[d.type] || '#6b7280' }} />
                <span className="text-sm text-gray-700 dark:text-gray-300">{SPORT_LABELS[d.type] || d.type}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.percentage}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  ({formatDuration(d.duration)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrainingLoadChart({ data }: { data: TrainingLoadPoint[] }) {
  if (data.length === 0) return null

  const maxVal = Math.max(...data.map(d => Math.max(d.ctl, d.atl, Math.abs(d.tsb))), 1)
  const width = 100
  const height = 40
  const padding = 2

  const makePoints = (values: number[]) => {
    return values.map((v, i) => {
      const x = padding + ((width - 2 * padding) * i) / Math.max(values.length - 1, 1)
      const y = height - padding - ((height - 2 * padding) * v) / maxVal
      return `${x},${y}`
    }).join(' ')
  }

  const ctlPoints = makePoints(data.map(d => d.ctl))
  const atlPoints = makePoints(data.map(d => d.atl))

  const tsbMax = Math.max(...data.map(d => Math.abs(d.tsb)), 1)
  const tsbMidY = height / 2
  const tsbPoints = data.map((d, i) => {
    const x = padding + ((width - 2 * padding) * i) / Math.max(data.length - 1, 1)
    const y = tsbMidY - ((height / 2 - padding) * d.tsb) / tsbMax
    return `${x},${y}`
  }).join(' ')

  const latest = data[data.length - 1]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Zap className="w-5 h-5 text-purple-500" />
        Charge d'entraînement
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Modèle Fitness / Fatigue / Forme (CTL / ATL / TSB)</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Fitness (CTL)</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{latest?.ctl || 0}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/30">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Fatigue (ATL)</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">{latest?.atl || 0}</p>
        </div>
        <div className={`text-center p-2 rounded-lg ${(latest?.tsb || 0) >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-amber-50 dark:bg-amber-900/30'}`}>
          <p className={`text-xs font-medium ${(latest?.tsb || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>Forme (TSB)</p>
          <p className={`text-lg font-bold ${(latest?.tsb || 0) >= 0 ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>{latest?.tsb || 0}</p>
        </div>
      </div>

      <div className="mb-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
          <polyline points={ctlPoints} fill="none" stroke="#3b82f6" strokeWidth="0.6" strokeLinejoin="round" />
          <polyline points={atlPoints} fill="none" stroke="#ef4444" strokeWidth="0.6" strokeLinejoin="round" strokeDasharray="1 0.5" />
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Forme (TSB) - positif = frais, négatif = fatigué</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
        <line x1={padding} y1={tsbMidY} x2={width - padding} y2={tsbMidY} stroke="currentColor" strokeWidth="0.3" className="text-gray-200 dark:text-slate-600" />
        <polyline points={tsbPoints} fill="none" stroke="#22c55e" strokeWidth="0.6" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = padding + ((width - 2 * padding) * i) / Math.max(data.length - 1, 1)
          const y = tsbMidY - ((height / 2 - padding) * d.tsb) / tsbMax
          if (i % 7 !== 0) return null
          return (
            <circle key={i} cx={x} cy={y} r="0.8" fill={d.tsb >= 0 ? '#22c55e' : '#f59e0b'} />
          )
        })}
      </svg>

      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Fitness (CTL)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500 border-dashed" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Fatigue (ATL)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Forme (TSB)</span>
        </div>
      </div>
    </div>
  )
}

function WellnessCorrelationChart({ wellnessLogs, trainingLoad }: { wellnessLogs: WellnessLog[], trainingLoad: TrainingLoadPoint[] }) {
  if (wellnessLogs.length < 3 || trainingLoad.length < 3) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          Bien-être & Performance
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ajoutez au moins 3 entrées de bien-être pour voir la corrélation avec votre charge d'entraînement.
        </p>
      </div>
    )
  }

  // Build aligned dataset: match wellness logs with training load on same dates
  const loadByDate = new Map(trainingLoad.map(p => [p.date, p]))
  const aligned = wellnessLogs
    .map(log => {
      const dateKey = log.date.split('T')[0]
      const load = loadByDate.get(dateKey)
      return load ? { date: dateKey, readiness: log.readinessScore, atl: load.atl, tsb: load.tsb } : null
    })
    .filter(Boolean) as { date: string; readiness: number; atl: number; tsb: number }[]

  if (aligned.length < 3) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          Bien-être & Performance
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pas assez de données communes entre bien-être et entraînement pour calculer la corrélation.
        </p>
      </div>
    )
  }

  // Sort by date
  aligned.sort((a, b) => a.date.localeCompare(b.date))

  const width = 100
  const height = 40
  const padding = 2

  const maxReadiness = 100
  const maxAtl = Math.max(...aligned.map(d => d.atl), 1)

  const readinessPoints = aligned.map((d, i) => {
    const x = padding + ((width - 2 * padding) * i) / Math.max(aligned.length - 1, 1)
    const y = height - padding - ((height - 2 * padding) * d.readiness) / maxReadiness
    return `${x},${y}`
  }).join(' ')

  const atlPoints = aligned.map((d, i) => {
    const x = padding + ((width - 2 * padding) * i) / Math.max(aligned.length - 1, 1)
    const y = height - padding - ((height - 2 * padding) * d.atl) / maxAtl
    return `${x},${y}`
  }).join(' ')

  // Simple Pearson correlation between readiness and ATL
  const n = aligned.length
  const avgR = aligned.reduce((s, d) => s + d.readiness, 0) / n
  const avgA = aligned.reduce((s, d) => s + d.atl, 0) / n
  const cov = aligned.reduce((s, d) => s + (d.readiness - avgR) * (d.atl - avgA), 0) / n
  const stdR = Math.sqrt(aligned.reduce((s, d) => s + Math.pow(d.readiness - avgR, 2), 0) / n)
  const stdA = Math.sqrt(aligned.reduce((s, d) => s + Math.pow(d.atl - avgA, 2), 0) / n)
  const correlation = stdR > 0 && stdA > 0 ? cov / (stdR * stdA) : 0

  const avgReadiness = Math.round(avgR)
  const avgAtl = Math.round(avgA)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Heart className="w-5 h-5 text-rose-500" />
        Bien-être & Performance
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Corrélation entre votre forme subjective et la charge d'entraînement
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Forme moy.</p>
          <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{avgReadiness}<span className="text-xs">/100</span></p>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/30">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Fatigue moy.</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">{avgAtl}</p>
        </div>
        <div className={`text-center p-2 rounded-lg ${Math.abs(correlation) > 0.5 ? 'bg-purple-50 dark:bg-purple-900/30' : 'bg-gray-50 dark:bg-slate-700'}`}>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Corrélation</p>
          <p className={`text-lg font-bold ${Math.abs(correlation) > 0.5 ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>
            {correlation > 0 ? '+' : ''}{(correlation * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <polyline points={readinessPoints} fill="none" stroke="#f43f5e" strokeWidth="0.6" strokeLinejoin="round" />
        <polyline points={atlPoints} fill="none" stroke="#ef4444" strokeWidth="0.6" strokeLinejoin="round" strokeDasharray="1 0.5" />
      </svg>

      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-rose-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Forme subjective</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500" style={{ borderTop: '1px dashed' }} />
          <span className="text-xs text-gray-600 dark:text-gray-400">Fatigue (ATL)</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {correlation < -0.3
          ? 'La fatigue impacte négativement votre forme — pensez à planifier des semaines de récupération.'
          : correlation > 0.3
            ? 'Bonne adaptation à la charge — votre forme suit positivement votre entraînement.'
            : 'Pas de corrélation marquée — continuez à enregistrer pour affiner l\'analyse.'}
      </p>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, subValue, color }: {
  icon: typeof Activity
  label: string
  value: string | number
  subValue?: string
  color: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
          {subValue && <p className="text-xs text-gray-400 dark:text-gray-500">{subValue}</p>}
        </div>
      </div>
    </div>
  )
}

export default function StatisticsPage() {
  const { data: overall, isLoading: loadingOverall } = useQuery({
    queryKey: ['statistics', 'overall'],
    queryFn: () => statisticsApi.getOverallStats().then(r => r.data),
  })

  const { data: weekly, isLoading: loadingWeekly } = useQuery({
    queryKey: ['statistics', 'weekly'],
    queryFn: () => statisticsApi.getWeeklyStats(12).then(r => r.data),
  })

  const { data: distribution, isLoading: loadingDistribution } = useQuery({
    queryKey: ['statistics', 'distribution'],
    queryFn: () => statisticsApi.getSportDistribution(90).then(r => r.data),
  })

  const { data: trainingLoad } = useQuery({
    queryKey: ['statistics', 'training-load'],
    queryFn: () => statisticsApi.getTrainingLoad(90).then(r => r.data),
  })

  const { data: wellnessTrend } = useQuery({
    queryKey: ['wellness', 'trend', 90],
    queryFn: () => wellnessApi.getTrend(90).then(r => r.data),
  })

  if (loadingOverall || loadingWeekly || loadingDistribution) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="text" className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton variant="card" className="h-24" />
          <Skeleton variant="card" className="h-24" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Statistiques</h1>

      {/* Overall stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Séances totales"
          value={overall?.totalSessions || 0}
          subValue={`${overall?.completedSessions || 0} complétées`}
          color="bg-blue-500"
        />
        <StatCard
          icon={Target}
          label="Taux de complétion"
          value={`${overall?.completionRate || 0}%`}
          color="bg-green-500"
        />
        <StatCard
          icon={Clock}
          label="Temps total"
          value={formatDuration(overall?.totalDuration || 0)}
          subValue={`Moy: ${formatDuration(overall?.averageSessionDuration || 0)}/séance`}
          color="bg-purple-500"
        />
        <StatCard
          icon={MapPin}
          label="Distance totale"
          value={formatDistance(overall?.totalDistance || 0)}
          color="bg-orange-500"
        />
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Série actuelle</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{overall?.currentStreak || 0} jours</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Meilleure série</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{overall?.longestStreak || 0} jours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {weekly && weekly.length > 0 && <WeeklyChart data={weekly} />}
        {distribution && distribution.length > 0 && <DistributionChart data={distribution} />}
      </div>

      {/* Training Load */}
      {trainingLoad && trainingLoad.length > 0 && (
        <TrainingLoadChart data={trainingLoad} />
      )}

      {/* Wellness / Performance correlation */}
      {trainingLoad && trainingLoad.length > 0 && (
        <WellnessCorrelationChart
          wellnessLogs={wellnessTrend?.logs || []}
          trainingLoad={trainingLoad}
        />
      )}

      {/* Empty state */}
      {(!weekly || weekly.length === 0) && (!distribution || distribution.length === 0) && (
        <EmptyState
          variant="statistics"
          action={{
            label: 'Voir les entraînements',
            href: '/training',
          }}
        />
      )}
    </div>
  )
}
