import { useQuery } from '@tanstack/react-query'
import { Users, Sparkles, ClipboardList, Trophy } from 'lucide-react'
import { groupsApi } from '@/api/groups.api'

const MOCK_RESULTS = [
  { initials: 'SA', name: 'Sofia Adler', event: 'Half Vichy', time: '5h12:30', date: '08 juin', rank: '2e', color: 'bg-teal-500' },
  { initials: 'MP', name: 'Marc Petit', event: 'Duathlon de Nantes', time: '0h58:12', date: '23 mai', rank: '3e', color: 'bg-slate-500' },
  { initials: 'LF', name: 'Léa Fontaine', event: 'Triathlon de Pornic', time: '1h12:40', date: '11 mai', rank: '8e', color: 'bg-orange-500' },
]

const MOCK_WATCH = [
  { initials: 'HD', name: 'Hélène Dubois', subtitle: 'TSB -7 · signaux de surcharge', badge: 'Repos', badgeColor: 'bg-gray-100 text-gray-600', color: 'bg-purple-500' },
  { initials: 'LF', name: 'Léa Fontaine', subtitle: 'Forme en baisse · 2 grosses semaines', badge: 'TSB -5', badgeColor: 'bg-red-100 text-red-700', color: 'bg-orange-500' },
]

export default function ClubCoachDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['coach-stats'],
    queryFn: () => groupsApi.stats().then(r => r.data),
    staleTime: 60000,
  })

  const s = stats ?? { athleteCount: 16, weeklyAttendance: 84, plansSent: 12, nextCompetitionName: 'Tri Vertou', nextCompetitionDays: 12 }

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord du club</h1>
          <p className="text-sm text-gray-500 mt-1">Triathlon Club Nantais · résultats, forme et suivi de tous les athlètes</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-sm font-medium text-gray-700">Semaine 6 / 12 · saison 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="w-[34px] h-[34px] rounded-[10px] bg-cyan-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-cyan-500" />
            </span>
            <span className="text-xs text-gray-400">4 groupes</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Athlètes</p>
          <p className="text-[25px] font-extrabold text-gray-900 leading-none">{s.athleteCount}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="w-[34px] h-[34px] rounded-[10px] bg-orange-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-orange-500" />
            </span>
            <span className="text-xs font-medium text-emerald-600">↑ 6%</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Assiduité · semaine</p>
          <p className="text-[25px] font-extrabold text-gray-900 leading-none">{s.weeklyAttendance}%</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="w-[34px] h-[34px] rounded-[10px] bg-teal-100 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-teal-500" />
            </span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">cette semaine</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Plans envoyés</p>
          <p className="text-[25px] font-extrabold text-gray-900 leading-none">{s.plansSent}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="w-[34px] h-[34px] rounded-[10px] bg-orange-100 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-orange-500" />
            </span>
            {s.nextCompetitionName && (
              <span className="text-xs text-orange-600 font-medium truncate max-w-[80px]">{s.nextCompetitionName}</span>
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Prochaine course</p>
          <p className="text-[25px] font-extrabold text-gray-900 leading-none">
            {s.nextCompetitionDays != null ? `J-${s.nextCompetitionDays}` : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Résultats récents du club</h2>
            <button className="text-xs text-orange-600 hover:underline">Tout voir →</button>
          </div>
          <div className="space-y-3">
            {MOCK_RESULTS.map((r) => (
              <div key={r.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-9 h-9 rounded-xl ${r.color} flex items-center justify-center text-white text-xs font-bold flex-none`}>
                  {r.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.event}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold text-gray-900">{r.time}</p>
                  <p className="text-xs text-gray-400">{r.date}</p>
                </div>
                <span className="ml-2 text-sm font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded-lg">{r.rank}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Athlètes à suivre</h2>
          <p className="text-xs text-gray-400 mb-4">Forme basse ou séances manquées</p>
          <div className="space-y-3">
            {MOCK_WATCH.map((a) => (
              <div key={a.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-9 h-9 rounded-full ${a.color} flex items-center justify-center text-white text-xs font-bold flex-none`}>
                  {a.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.subtitle}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.badgeColor}`}>{a.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
