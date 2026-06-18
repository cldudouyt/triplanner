import { useQuery } from '@tanstack/react-query'
import { Activity, UserPlus, Trophy, Dumbbell } from 'lucide-react'
import { adminApi } from '@/api/admin.api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatDate, formatRelative } from '@/utils/formatDate'

export default function AdminLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'logs'],
    queryFn: () => adminApi.getSystemLogs().then(r => r.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activité système</h1>
        <p className="text-gray-500 mt-1">
          Événements récents sur la plateforme
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent registrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <UserPlus className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle>Inscriptions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentRegistrations && data.recentRegistrations.length > 0 ? (
              <div className="space-y-3">
                {data.recentRegistrations.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                        {user.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900 truncate max-w-[150px]">
                        {user.email}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatRelative(user.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Aucune inscription récente</p>
            )}
          </CardContent>
        </Card>

        {/* Recent session activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100">
                <Dumbbell className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle>Séances modifiées</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentSessionActivity && data.recentSessionActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentSessionActivity.slice(0, 10).map(session => (
                  <div key={session.id} className="p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                        {session.title || 'Séance sans titre'}
                      </span>
                      <span className="text-xs text-gray-500">{formatRelative(session.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {session.plan.name} • {session.plan.user.email}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>

        {/* Recent competition activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-100">
                <Trophy className="w-4 h-4 text-orange-600" />
              </div>
              <CardTitle>Compétitions modifiées</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentCompetitionActivity && data.recentCompetitionActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentCompetitionActivity.map(comp => (
                  <div key={comp.id} className="p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                        {comp.name}
                      </span>
                      <span className="text-xs text-gray-500">{formatRelative(comp.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {comp.user.email}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100">
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
            <CardTitle>Chronologie</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              ...(data?.recentRegistrations?.map(u => ({ type: 'user', date: u.createdAt, data: u })) || []),
              ...(data?.recentSessionActivity?.slice(0, 10).map(s => ({ type: 'session', date: s.updatedAt, data: s })) || []),
              ...(data?.recentCompetitionActivity?.map(c => ({ type: 'competition', date: c.updatedAt, data: c })) || []),
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 20)
              .map((event, index) => (
                <div key={`${event.type}-${index}`} className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    event.type === 'user' ? 'bg-blue-100' :
                    event.type === 'session' ? 'bg-green-100' :
                    'bg-orange-100'
                  }`}>
                    {event.type === 'user' ? <UserPlus className="w-4 h-4 text-blue-600" /> :
                     event.type === 'session' ? <Dumbbell className="w-4 h-4 text-green-600" /> :
                     <Trophy className="w-4 h-4 text-orange-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {event.type === 'user' && (
                        <>Nouvel utilisateur : <span className="font-medium">{(event.data as any).email}</span></>
                      )}
                      {event.type === 'session' && (
                        <>Séance modifiée : <span className="font-medium">{(event.data as any).title || 'Sans titre'}</span> dans {(event.data as any).plan.name}</>
                      )}
                      {event.type === 'competition' && (
                        <>Compétition modifiée : <span className="font-medium">{(event.data as any).name}</span></>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(event.date)} • {formatRelative(event.date)}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
