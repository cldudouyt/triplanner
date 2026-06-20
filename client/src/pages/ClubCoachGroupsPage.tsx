import { useQuery } from '@tanstack/react-query'
import { Plus, MoreVertical } from 'lucide-react'
import { groupsApi, type TrainingGroup } from '@/api/groups.api'

const LEVEL_BADGE: Record<string, string> = {
  'Débutant': 'bg-cyan-100 text-cyan-700',
  'Intermédiaire': 'bg-emerald-100 text-emerald-700',
  'Avancé': 'bg-orange-100 text-orange-700',
  'Élite': 'bg-purple-100 text-purple-700',
}

const GROUP_ICON_BG: Record<string, string> = {
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  slate: 'bg-slate-500',
}

function getInitials(firstName: string, lastName: string) {
  return (firstName[0] ?? '') + (lastName[0] ?? '')
}

const AVATAR_COLORS = ['bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500', 'bg-blue-500', 'bg-amber-500']

function avatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const MOCK_GROUPS: TrainingGroup[] = [
  { id: 1, name: 'Découverte', level: 'Débutant', description: 'Premiers pas en triathlon.', icon: 'leaf', color: 'cyan', weeklyHours: 5, sessionsPerWeek: 4, members: [{ id: 1, firstName: 'Yanis', lastName: 'Baki', currentTSB: 15 }, { id: 2, firstName: 'Emma', lastName: 'Le Goff', currentTSB: 9 }, { id: 3, firstName: 'Noé', lastName: 'Renaud', currentTSB: 11 }, { id: 4, firstName: 'Théo', lastName: 'Pichon', currentTSB: 6 }] },
  { id: 2, name: 'Endurance Loisir', level: 'Intermédiaire', description: 'Forme et sorties longues.', icon: 'bike', color: 'emerald', weeklyHours: 7, sessionsPerWeek: 5, members: [{ id: 5, firstName: 'Clara', lastName: 'Roux', currentTSB: 3 }, { id: 6, firstName: 'Marc', lastName: 'Berthier', currentTSB: -4 }, { id: 7, firstName: 'Julie', lastName: 'Lemaire', currentTSB: 7 }, { id: 8, firstName: 'Adrien', lastName: 'Daniel', currentTSB: 1 }] },
  { id: 3, name: 'Compétition', level: 'Avancé', description: 'Objectifs de saison structurés.', icon: 'trophy', color: 'orange', weeklyHours: 8.5, sessionsPerWeek: 6, members: [{ id: 9, firstName: 'Léa', lastName: 'Fontaine', currentTSB: -5 }, { id: 10, firstName: 'Marc', lastName: 'Petit', currentTSB: 8 }, { id: 11, firstName: 'Sofia', lastName: 'Adler', currentTSB: -2 }] },
  { id: 4, name: 'Longue Distance', level: 'Élite', description: 'Préparation Half & Ironman.', icon: 'mountain', color: 'slate', weeklyHours: 12, sessionsPerWeek: 7, members: [{ id: 12, firstName: 'Hélène', lastName: 'Dubois', currentTSB: -7 }] },
]

function GroupCard({ group }: { group: TrainingGroup }) {
  const iconBg = GROUP_ICON_BG[group.color ?? 'orange'] ?? 'bg-orange-500'
  const levelClass = LEVEL_BADGE[group.level] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-orange-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-white text-lg flex-none`}>
          {group.icon === 'leaf' ? '🌱' : group.icon === 'bike' ? '🚴' : group.icon === 'trophy' ? '🏆' : '⛰️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{group.name}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelClass}`}>{group.level}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{group.members.length} athlètes · {group.weeklyHours}h/sem</p>
        </div>
        <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {group.members.map((m) => {
          const tsb = m.currentTSB
          const tsbClass = tsb >= 5 ? 'bg-emerald-100 text-emerald-700' : tsb <= -3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
          const tsbLabel = tsb >= 0 ? `TSB +${tsb}` : `TSB ${tsb}`
          return (
            <div key={m.id} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full ${avatarColor(m.firstName)} flex items-center justify-center text-white text-[10px] font-bold flex-none`}>
                {getInitials(m.firstName, m.lastName)}
              </div>
              <span className="flex-1 text-sm text-gray-700">{m.firstName} {m.lastName}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tsbClass}`}>{tsbLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ClubCoachGroupsPage() {
  const { data: groups } = useQuery({
    queryKey: ['coach-groups'],
    queryFn: () => groupsApi.list().then(r => r.data),
    staleTime: 60000,
  })

  const displayGroups = groups ?? MOCK_GROUPS

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groupes d'entraînement</h1>
          <p className="text-sm text-gray-500 mt-1">Organise tes athlètes par niveau</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-sm font-medium text-gray-700">Semaine 6 / 12 · saison 2026</span>
          </div>
          <button
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
            style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
          >
            <Plus className="w-4 h-4" /> Nouveau groupe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {displayGroups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  )
}
