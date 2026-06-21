import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus } from 'lucide-react'
import { adminCoachApi, type AdminMember } from '@/api/admin.api'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

const MOCK_MEMBERS: AdminMember[] = [
  { id: 1, firstName: 'Léa', lastName: 'Fontaine', email: 'lea.fontaine@tcn.fr', role: 'athlete', group: 'Compétition', status: 'active' },
  { id: 2, firstName: 'Thomas', lastName: 'Mercier', email: 'thomas.mercier@tcn.fr', role: 'coach', group: 'Encadrement', status: 'active' },
  { id: 3, firstName: 'Marie', lastName: 'Lemoine', email: 'marie.lemoine@tcn.fr', role: 'admin', group: 'CODIR', status: 'active' },
  { id: 4, firstName: 'Sofia', lastName: 'Adler', email: 'sofia.adler@tcn.fr', role: 'athlete', group: 'Longue Distance', status: 'active' },
  { id: 5, firstName: 'Marc', lastName: 'Petit', email: 'marc.petit@tcn.fr', role: 'athlete', group: 'Compétition', status: 'active' },
]

const AVATAR_COLORS = ['bg-orange-400', 'bg-violet-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500']
function avatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(hash)]
}

const ROLE_LABELS: Record<string, string> = { athlete: 'Membre', coach: 'Coach', admin: 'Admin CODIR' }
const ROLE_STYLE = 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-600'
const ROLE_ACTIVE: Record<string, string> = {
  athlete: 'bg-gray-700 text-white font-semibold border border-gray-700',
  coach:   'bg-orange-500 text-white font-semibold border border-orange-500',
  admin:   'bg-violet-600 text-white font-semibold border border-violet-600',
}
const TABS = ['Tous', 'Coachs', 'Admins']

export default function AdminMembresPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Tous')
  const qc = useQueryClient()

  const filter = activeTab === 'Coachs' ? 'coaches' : activeTab === 'Admins' ? 'admins' : undefined

  const { data, isLoading } = useQuery({
    queryKey: ['admin-members', filter],
    queryFn: () => adminCoachApi.getMembers(filter).then(r => r.data).catch(() => MOCK_MEMBERS),
    initialData: MOCK_MEMBERS,
  })

  const members = data ?? MOCK_MEMBERS
  const filtered = useMemo(() =>
    members.filter(m => `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase())),
    [members, search])

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminCoachApi.updateRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-members'] }); toast.success('Rôle mis à jour') },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  if (isLoading) return <SkeletonDashboard />

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Membres & droits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Attribue les droits coach et admin à chaque licencié</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-300 outline-none w-56" />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
            <UserPlus className="w-4 h-4" />
            Inviter
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 text-sm rounded-xl font-medium transition-all ${
                activeTab === t ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}>{t}</button>
          ))}
          <span className="ml-auto text-sm text-gray-400">{filtered.length} membres</span>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
              <th className="px-4 py-2">Membre</th>
              <th className="px-4 py-2">Groupe</th>
              <th className="px-4 py-2">Droits attribués</th>
              <th className="px-4 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${avatarColor(m.firstName + m.lastName)} flex items-center justify-center text-white text-xs font-bold flex-none`}>
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.firstName} {m.lastName}</div>
                      <div className="text-xs text-gray-400">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{m.group ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {(['athlete', 'coach', 'admin'] as const).map(r => (
                      <button key={r} onClick={() => roleMutation.mutate({ id: m.id, role: r })}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-all ${m.role === r ? ROLE_ACTIVE[r] : ROLE_STYLE}`}>
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Actif</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
