import { useQuery } from '@tanstack/react-query'
import { UserPlus, Users, Mail, Shield, ShieldCheck } from 'lucide-react'
import { adminCoachApi, type AdminStats } from '@/api/admin.api'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

const MOCK_STATS: AdminStats = {
  members: 9,
  coaches: 3,
  admins: 2,
  pendingInvitations: 2,
  recentActivity: [
    { id: 1, email: 'camille.durand@email.fr', role: 'member', createdAt: new Date(Date.now() - 7200000).toISOString(), invitedBy: { firstName: 'Marie', lastName: 'Lemoine' } },
    { id: 2, email: 'hugo.masson@email.fr', role: 'coach', createdAt: new Date(Date.now() - 86400000).toISOString(), invitedBy: { firstName: 'Marie', lastName: 'Lemoine' } },
    { id: 3, email: 'noe.renaud@email.fr', role: 'member', createdAt: new Date(Date.now() - 259200000).toISOString(), invitedBy: { firstName: 'Thomas', lastName: 'Mercier' } },
  ],
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 3600000) return `il y a ${Math.round(diff / 60000)}min`
  if (diff < 86400000) return `il y a ${Math.round(diff / 3600000)}h`
  return `${Math.round(diff / 86400000)} j`
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminCoachApi.getStats().then(r => r.data).catch(() => MOCK_STATS),
    initialData: MOCK_STATS,
  })

  if (isLoading) return <SkeletonDashboard />

  const total = (stats?.members ?? 0) + (stats?.coaches ?? 0) + (stats?.admins ?? 0)

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Administration du club</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">CODIR · Triathlon Club Nantais · gestion des membres et des droits</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
          <UserPlus className="w-4 h-4" />
          Inviter un membre
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Membres du club', sub: 'saison 2026', value: stats?.members ?? 0, icon: Users, iconClass: 'text-slate-600', bgClass: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Invitations en attente', sub: 'à relancer', value: stats?.pendingInvitations ?? 0, icon: Mail, iconClass: 'text-orange-600', bgClass: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Coachs', sub: 'droits actifs', value: stats?.coaches ?? 0, icon: ShieldCheck, iconClass: 'text-orange-600', bgClass: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Admins CODIR', sub: 'droits actifs', value: stats?.admins ?? 0, icon: Shield, iconClass: 'text-violet-600', bgClass: 'bg-violet-50 dark:bg-violet-900/20' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <div className={`w-10 h-10 rounded-xl ${card.bgClass} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.iconClass}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{card.label}</div>
            <div className="text-xs text-gray-400">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Répartition des droits</h3>
          <div className="space-y-3">
            {[
              { label: 'Membres', count: stats?.members ?? 0, color: 'bg-slate-400' },
              { label: 'Coachs', count: stats?.coaches ?? 0, color: 'bg-orange-500' },
              { label: 'Admins CODIR', count: stats?.admins ?? 0, color: 'bg-violet-500' },
            ].map(bar => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-600 dark:text-gray-400 flex-none">{bar.label}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full rounded-full ${bar.color}`}
                    style={{ width: total > 0 ? `${(bar.count / total) * 100}%` : '0%' }} />
                </div>
                <span className="w-6 text-sm font-bold text-gray-700 dark:text-gray-300 flex-none text-right">{bar.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Activité d'administration</h3>
          <div className="space-y-3">
            {(stats?.recentActivity ?? []).map(act => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-none">
                  <Mail className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Invitation envoyée à <span className="font-medium">{act.email}</span>
                    {act.role === 'coach' && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700">Coach</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Par {act.invitedBy.firstName} {act.invitedBy.lastName} · {timeAgo(act.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
