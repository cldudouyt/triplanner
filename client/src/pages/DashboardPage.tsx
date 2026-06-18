import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Dumbbell, Calendar, ArrowRight, Activity, Clock, Target, Flame, Heart, Award, AlertTriangle, Timer } from 'lucide-react'
import { competitionsApi } from '@/api/competitions.api'
import { trainingPlansApi } from '@/api/trainingPlans.api'
import { statisticsApi } from '@/api/statistics.api'
import { wellnessApi } from '@/api/wellness.api'
import { achievementsApi } from '@/api/achievements.api'
import { formatDate, formatRelative } from '@/utils/formatDate'
import { getSportColor } from '@/utils/constants'
import PriorityBadge from '@/components/competitions/PriorityBadge'
import { useAuth } from '@/context/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { EmptyState, EmptyStateInline } from '@/components/ui/EmptyState'
import { ProgressBar, CircularProgress } from '@/components/ui/ProgressBar'
import { OnboardingModal, useOnboarding } from '@/components/onboarding'
import RaceDayBanner from '@/components/dashboard/RaceDayBanner'
import GoalsWidget from '@/components/dashboard/GoalsWidget'
import clsx from 'clsx'

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { showOnboarding, closeOnboarding } = useOnboarding()

  const { data: competitionsData, isLoading: loadingCompetitions } = useQuery({
    queryKey: ['competitions', { sortBy: 'date', sortOrder: 'asc', limit: 5, status: 'planned' }],
    queryFn: () => competitionsApi.list({ sortBy: 'date', sortOrder: 'asc', limit: 5 }).then(r => r.data),
  })

  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['training-plans'],
    queryFn: () => trainingPlansApi.list().then(r => r.data),
  })

  const plans = plansData?.data || []

  const { data: dashboardData, isLoading: loadingStats } = useQuery({
    queryKey: ['statistics', 'dashboard'],
    queryFn: () => statisticsApi.getDashboard().then(r => r.data),
  })

  const { data: todayWellness } = useQuery({
    queryKey: ['wellness', 'today'],
    queryFn: () => wellnessApi.getToday().then(r => r.data),
  })

  const { data: wellnessAlerts } = useQuery({
    queryKey: ['wellness', 'alerts'],
    queryFn: () => wellnessApi.getAlerts().then(r => r.data),
  })

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementsApi.getAll().then(r => r.data),
  })

  const isLoading = loadingCompetitions || loadingPlans || loadingStats

  const upcomingCompetitions = competitionsData?.data
    .filter(c => new Date(c.date) >= new Date())
    .slice(0, 3) || []

  const nextCompetition = upcomingCompetitions[0] || null

  const totalCompetitions = competitionsData?.total || 0

  if (isLoading) {
    return <SkeletonDashboard />
  }

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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bonjour {user?.firstName} !
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Voici un résumé de votre activité</p>
      </div>

      {/* Wellness alerts */}
      {wellnessAlerts && wellnessAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {wellnessAlerts.map((alert, i) => (
            <div
              key={i}
              className={clsx(
                'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm',
                alert.severity === 'danger'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              )}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Compétitions"
          value={totalCompetitions}
          icon={<Trophy className="h-5 w-5" />}
          color="red"
          animate
        />
        <StatCard
          title="Séances"
          value={dashboardData?.overall.completedSessions || 0}
          icon={<Activity className="h-5 w-5" />}
          color="blue"
          animate
        />
        <StatCard
          title="Complétion"
          value={`${dashboardData?.overall.completionRate || 0}%`}
          icon={<Target className="h-5 w-5" />}
          color="green"
          animate
        />
        <StatCard
          title="Jours série"
          value={dashboardData?.overall.currentStreak || 0}
          icon={<Flame className="h-5 w-5" />}
          color="orange"
          animate
        />
      </div>

      {/* Countdown + Wellness row */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Countdown widget */}
        <Card animate>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-500" />
                Prochaine compétition
              </div>
            </CardTitle>
            <Link to="/competitions" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
              Voir <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {nextCompetition ? (
              <div className="text-center py-2">
                <div className={clsx(
                  'text-5xl font-black mb-1',
                  daysUntil(nextCompetition.date) <= 7
                    ? 'text-red-600 dark:text-red-400'
                    : daysUntil(nextCompetition.date) <= 30
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                )}>
                  J-{daysUntil(nextCompetition.date)}
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mt-1 truncate">
                  {nextCompetition.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatDate(nextCompetition.date)}
                </p>
                {nextCompetition.location && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{nextCompetition.location}</p>
                )}
              </div>
            ) : (
              <EmptyStateInline message="Aucune compétition planifiée" />
            )}
          </CardContent>
        </Card>

        {/* Wellness widget */}
        <Card animate>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Bien-être du jour
              </div>
            </CardTitle>
            <Link to="/wellness" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
              Détails <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {todayWellness ? (
              <div className="flex items-center gap-4">
                <CircularProgress
                  value={todayWellness.readinessScore}
                  size={64}
                  strokeWidth={4}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {todayWellness.readinessScore >= 80 ? 'Excellent' : todayWellness.readinessScore >= 60 ? 'Bon' : todayWellness.readinessScore >= 40 ? 'Modéré' : 'Faible'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {todayWellness.readinessScore >= 80 ? 'Prêt pour l\'effort' : todayWellness.readinessScore >= 60 ? 'Entraînement normal' : 'Privilégiez la récupération'}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyStateInline
                message="Pas de check-in aujourd'hui"
                action={{ label: 'Faire mon check-in', onClick: () => {} }}
              />
            )}
          </CardContent>
        </Card>

        {/* Achievements widget */}
        <Card animate>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Badges
              </div>
            </CardTitle>
            <Link to="/achievements" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {achievements && achievements.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length} débloqués
                  </span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
                  </span>
                </div>
                <ProgressBar
                  value={achievements.filter(a => a.unlocked).length}
                  max={achievements.length}
                  color="orange"
                  size="md"
                  className="mb-3"
                />
                <div className="flex flex-wrap gap-1.5">
                  {achievements.filter(a => a.unlocked).slice(0, 8).map(a => (
                    <span key={a.id} className="text-xl" title={a.name}>{a.icon}</span>
                  ))}
                  {achievements.filter(a => a.unlocked).length > 8 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">+{achievements.filter(a => a.unlocked).length - 8}</span>
                  )}
                </div>
              </div>
            ) : (
              <EmptyStateInline message="Commencez à vous entraîner !" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming sessions */}
      {dashboardData?.upcoming && dashboardData.upcoming.length > 0 && (
        <Card className="mb-6" animate>
          <CardHeader>
            <CardTitle>Séances à venir</CardTitle>
            <Link to="/calendar" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
              Calendrier <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.upcoming.slice(0, 5).map((session: any) => {
                const sportColor = getSportColor(session.type)
                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-lg',
                        sportColor.bgLight
                      )}
                    >
                      {sportColor.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {session.title || sportColor.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {session.plan.name} - {formatDate(session.date)}
                      </p>
                    </div>
                    {session.duration && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(session.duration)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming competitions */}
      <Card className="mb-6" animate>
        <CardHeader>
          <CardTitle>Prochaines compétitions</CardTitle>
          <Link to="/competitions" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingCompetitions.length === 0 ? (
            <EmptyState
              variant="competitions"
              title="Aucune compétition à venir"
              description="Ajoutez votre première compétition pour commencer à planifier."
              action={{
                label: 'Ajouter une compétition',
                onClick: () => {},
              }}
            />
          ) : (
            <div className="space-y-3">
              {upcomingCompetitions.map(comp => {
                const days = daysUntil(comp.date)
                return (
                  <Link
                    key={comp.id}
                    to={`/competitions/${comp.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[50px]">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">
                          {new Date(comp.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {new Date(comp.date).getDate()}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{comp.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {comp.location && `${comp.location} - `}
                          {comp.type === 'triathlon' ? 'Triathlon' : 'Course'} {comp.subType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PriorityBadge priority={comp.priority} />
                      <span className={clsx(
                        'text-xs font-medium hidden sm:inline px-2 py-0.5 rounded-full',
                        days <= 7
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : days <= 30
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                      )}>
                        J-{days}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Season goals */}
      <div className="mb-6">
        <GoalsWidget />
      </div>

      {/* Active training plans */}
      {plans.length > 0 && (
        <Card animate>
          <CardHeader>
            <CardTitle>Plans d'entraînement actifs</CardTitle>
            <Link to="/training" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plans.slice(0, 3).map(plan => {
                const completed = plan.sessions?.filter((s: any) => s.completed).length || 0
                const total = plan._count?.sessions || plan.sessions?.length || 0
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0
                return (
                  <Link
                    key={plan.id}
                    to={`/training/${plan.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{plan.name}</p>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} color="gradient" size="sm" />
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
