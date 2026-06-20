import { useState } from 'react'
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react'

const DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const COMPETITIONS = [
  { label: 'J-12', name: 'Tri Sprint de Vertou', date: '02 juil · Sprint', priority: 'C', athletes: ['MP', 'YB'] },
  { label: 'J-24', name: 'Triathlon de Nantes', date: '19 oct · Olympique', priority: 'A', athletes: ['LF', 'HD', 'MP'] },
  { label: 'J-58', name: 'Audencia La Baule', date: '12 sept · Half', priority: 'B', athletes: ['LF', 'SA'] },
]

interface GroupSession { day: number; sport: string; duration: string; color: string }
interface GroupRow { name: string; dot: string; sessions: GroupSession[] }

const GROUPS_CALENDAR: GroupRow[] = [
  {
    name: 'Découverte', dot: 'bg-cyan-500',
    sessions: [
      { day: 0, sport: 'Nat.', duration: '0h45', color: 'text-cyan-600 bg-cyan-50' },
      { day: 2, sport: 'Vélo', duration: '1h00', color: 'text-emerald-600 bg-emerald-50' },
      { day: 3, sport: 'Renfo', duration: '0h30', color: 'text-slate-600 bg-slate-50' },
      { day: 6, sport: 'Course', duration: '0h45', color: 'text-orange-600 bg-orange-50' },
    ],
  },
  {
    name: 'Endurance Loisir', dot: 'bg-emerald-500',
    sessions: [
      { day: 0, sport: 'Nat.', duration: '0h55', color: 'text-cyan-600 bg-cyan-50' },
      { day: 1, sport: 'Course', duration: '0h50', color: 'text-orange-600 bg-orange-50' },
      { day: 3, sport: 'Vélo', duration: '1h15', color: 'text-emerald-600 bg-emerald-50' },
      { day: 4, sport: 'Renfo', duration: '0h35', color: 'text-slate-600 bg-slate-50' },
      { day: 5, sport: 'Vélo', duration: '1h30', color: 'text-emerald-600 bg-emerald-50' },
    ],
  },
  {
    name: 'Compétition', dot: 'bg-orange-500',
    sessions: [
      { day: 0, sport: 'Nat.', duration: '1h00', color: 'text-cyan-600 bg-cyan-50' },
      { day: 1, sport: 'Vélo', duration: '1h55', color: 'text-emerald-600 bg-emerald-50' },
      { day: 2, sport: 'Nat.', duration: '1h00', color: 'text-cyan-600 bg-cyan-50' },
      { day: 3, sport: 'Course', duration: '0h50', color: 'text-orange-600 bg-orange-50' },
      { day: 5, sport: 'Vélo', duration: '2h30', color: 'text-emerald-600 bg-emerald-50' },
      { day: 6, sport: 'Course', duration: '1h15', color: 'text-orange-600 bg-orange-50' },
    ],
  },
  {
    name: 'Longue Distance', dot: 'bg-slate-500',
    sessions: [
      { day: 0, sport: 'Nat.', duration: '1h15', color: 'text-cyan-600 bg-cyan-50' },
      { day: 1, sport: 'Vélo', duration: '2h30', color: 'text-emerald-600 bg-emerald-50' },
      { day: 2, sport: 'Nat.', duration: '1h00', color: 'text-cyan-600 bg-cyan-50' },
      { day: 3, sport: 'Course', duration: '1h00', color: 'text-orange-600 bg-orange-50' },
      { day: 4, sport: 'Vélo', duration: '1h30', color: 'text-emerald-600 bg-emerald-50' },
      { day: 5, sport: 'Vélo', duration: '3h00', color: 'text-emerald-600 bg-emerald-50' },
      { day: 6, sport: 'Course', duration: '1h30', color: 'text-orange-600 bg-orange-50' },
    ],
  },
]

const PRIORITY_BG: Record<string, string> = {
  A: 'linear-gradient(135deg,#EF4444,#DC2626)',
  B: 'linear-gradient(135deg,#FB923C,#EA580C)',
  C: 'linear-gradient(135deg,#334155,#1E293B)',
}

const AVATAR_BG: Record<string, string> = {
  LF: 'bg-orange-500', MP: 'bg-slate-500', YB: 'bg-cyan-500',
  HD: 'bg-purple-500', SA: 'bg-teal-500',
}

export default function ClubCoachCalendarPage() {
  const [_weekOffset, setWeekOffset] = useState(0)

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier du club</h1>
          <p className="text-sm text-gray-500 mt-1">Entraînements de tous les groupes et compétitions à venir</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-sm font-medium text-gray-700">Semaine 6 / 12 · saison 2026</span>
        </div>
      </div>

      {/* Competitions section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-900">Compétitions du club</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {COMPETITIONS.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 rounded-xl px-4 py-3 flex-none cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
              style={{ background: PRIORITY_BG[c.priority] }}
            >
              <div className="bg-white/25 rounded-lg px-2 py-1 text-center min-w-[3rem]">
                <p className="text-xs font-bold text-white">{c.label}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{c.name}</p>
                <p className="text-[11px] text-white/70">{c.date}</p>
              </div>
              <div className="flex -space-x-1 ml-1">
                {c.athletes.map((a) => (
                  <div
                    key={a}
                    className={`w-6 h-6 rounded-full ${AVATAR_BG[a] ?? 'bg-gray-400'} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training matrix */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-sm">Entraînements de la semaine · tous les groupes</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-xs text-gray-400 font-medium">15 – 21 juin</span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 w-40">Groupe</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-center text-xs font-semibold text-gray-400 pb-3">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS_CALENDAR.map((g) => (
                <tr key={g.name} className="border-t border-gray-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-none ${g.dot}`} />
                      <span className="text-sm font-medium text-gray-700">{g.name}</span>
                    </div>
                  </td>
                  {DAYS.map((_, i) => {
                    const session = g.sessions.find((s) => s.day === i)
                    return (
                      <td key={i} className="py-2 text-center">
                        {session ? (
                          <div className={`inline-flex flex-col items-center px-2 py-1 rounded-lg ${session.color}`}>
                            <span className="text-xs font-semibold">{session.sport}</span>
                            <span className="text-[10px]">{session.duration}</span>
                          </div>
                        ) : (
                          <span className="text-gray-200 text-sm">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
