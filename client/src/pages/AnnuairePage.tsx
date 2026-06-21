import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { annuaireApi, type ClubMemberDirectory } from '@/api/annuaire.api'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

const MOCK_MEMBERS: ClubMemberDirectory[] = [
  { id: 1, firstName: 'Léa', lastName: 'Fontaine', email: 'lea@tcn.fr', role: 'athlete', group: 'Compétition', isMe: true },
  { id: 2, firstName: 'Thomas', lastName: 'Mercier', email: 'thomas@tcn.fr', role: 'coach', group: 'Encadrement', isMe: false },
  { id: 3, firstName: 'Sofia', lastName: 'Adler', email: 'sofia@tcn.fr', role: 'athlete', group: 'Longue Distance', isMe: false },
  { id: 4, firstName: 'Marc', lastName: 'Petit', email: 'marc@tcn.fr', role: 'athlete', group: 'Compétition', isMe: false },
  { id: 5, firstName: 'Clara', lastName: 'Roux', email: 'clara@tcn.fr', role: 'athlete', group: 'Endurance Loisir', isMe: false },
  { id: 6, firstName: 'Yanis', lastName: 'Baki', email: 'yanis@tcn.fr', role: 'athlete', group: 'Découverte', isMe: false },
]

const GROUPS = ['Tous', 'Compétition', 'Longue Distance', 'Endurance Loisir', 'Découverte']

const AVATAR_COLORS = [
  'bg-orange-400',
  'bg-violet-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-emerald-500',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(hash)]
}

function MemberCard({ member }: { member: ClubMemberDirectory }) {
  const initials = `${member.firstName[0]}${member.lastName[0]}`
  const color = avatarColor(member.firstName + member.lastName)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 flex items-start gap-3">
      <div
        className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm flex-none`}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {member.firstName} {member.lastName}
          </span>
          {member.isMe && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              Moi
            </span>
          )}
          {member.role === 'coach' && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400">
              Staff
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{member.group}</p>
        {member.role === 'coach' && (
          <div className="flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Vélo</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnnuairePage() {
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('Tous')

  const { data, isLoading } = useQuery({
    queryKey: ['annuaire', activeGroup],
    queryFn: () =>
      annuaireApi
        .list(activeGroup === 'Tous' ? undefined : activeGroup)
        .then(r => r.data)
        .catch(() => MOCK_MEMBERS),
    initialData: MOCK_MEMBERS,
  })

  const members = data ?? MOCK_MEMBERS
  const filtered = useMemo(
    () =>
      members.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [members, search],
  )

  if (isLoading) return <SkeletonDashboard />

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Annuaire du club</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tous les licenciés du Triathlon Club Nantais · saison 2026
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un licencié..."
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none"
        />
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {GROUPS.map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-3 py-1.5 text-sm rounded-xl font-medium transition-all ${
              activeGroup === g
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            {g}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} licenciés</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(m => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
    </div>
  )
}
