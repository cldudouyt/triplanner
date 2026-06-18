import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, FileText, Trophy, Activity, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { adminApi } from '@/api/admin.api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { formatDate, formatRelative } from '@/utils/formatDate'

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de la plateforme</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Utilisateurs"
          value={stats?.users || 0}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          trend={stats?.usersThisMonth ? Math.round((stats.usersThisMonth / (stats.users || 1)) * 100) : 0}
        />
        <StatCard
          title="Plans"
          value={stats?.plans || 0}
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Compétitions"
          value={stats?.competitions || 0}
          icon={<Trophy className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="Séances"
          value={stats?.sessions || 0}
          icon={<Activity className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Nouveaux ce mois"
          value={stats?.usersThisMonth || 0}
          subtitle="utilisateurs"
          icon={<TrendingUp className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Actifs (7j)"
          value={stats?.activeUsersLast7Days || 0}
          subtitle="utilisateurs"
          icon={<Clock className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <Card>
          <CardHeader>
            <CardTitle>Derniers inscrits</CardTitle>
            <Link to="/admin/users" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Voir tous <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {data?.recentUsers && data.recentUsers.length > 0 ? (
              <div className="space-y-3">
                {data.recentUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatRelative(user.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Aucun utilisateur récent</p>
            )}
          </CardContent>
        </Card>

        {/* Recent plans */}
        <Card>
          <CardHeader>
            <CardTitle>Derniers plans créés</CardTitle>
            <Link to="/admin/content" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Voir tous <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {data?.recentPlans && data.recentPlans.length > 0 ? (
              <div className="space-y-3">
                {data.recentPlans.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{plan.name}</p>
                      <p className="text-sm text-gray-500">
                        par {plan.user.firstName} {plan.user.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {plan.targetType}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{formatRelative(plan.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Aucun plan récent</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gérer les utilisateurs</p>
                <p className="text-sm text-gray-500">Voir, modifier, supprimer</p>
              </div>
            </Link>

            <Link
              to="/admin/content?type=plans"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-green-100">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gérer les plans</p>
                <p className="text-sm text-gray-500">Plans d'entraînement</p>
              </div>
            </Link>

            <Link
              to="/admin/content?type=competitions"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-orange-100">
                <Trophy className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gérer les compétitions</p>
                <p className="text-sm text-gray-500">Événements utilisateurs</p>
              </div>
            </Link>

            <Link
              to="/admin/logs"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-purple-100">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Activité système</p>
                <p className="text-sm text-gray-500">Logs et événements</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
