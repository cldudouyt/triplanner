import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { seancesClubApi, type ClubSession } from '@/api/seances-club.api'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

const MOCK_SESSIONS: ClubSession[] = [
  {
    id: 1,
    title: 'Créneau natation · mardi',
    sport: 'swim',
    date: '2026-06-17',
    startTime: '19:00',
    endTime: '20:30',
    location: 'Piscine du Petit Port · lignes 4-5',
    capacity: 16,
    registeredCount: 14,
    waitlistCount: 0,
    isRegistered: false,
    isWaitlisted: false,
    attendees: [],
  },
  {
    id: 2,
    title: 'Créneau natation · jeudi',
    sport: 'swim',
    date: '2026-06-19',
    startTime: '12:30',
    endTime: '13:45',
    location: 'Piscine Léo Lagrange · ligne 3',
    capacity: 8,
    registeredCount: 8,
    waitlistCount: 2,
    isRegistered: false,
    isWaitlisted: false,
    attendees: [],
  },
  {
    id: 3,
    title: 'Sortie vélo du dimanche',
    sport: 'bike',
    date: '2026-06-22',
    startTime: '08:00',
    endTime: '10:30',
    location: 'Départ local TCN · 70 km',
    capacity: 20,
    registeredCount: 11,
    waitlistCount: 0,
    isRegistered: false,
    isWaitlisted: false,
    attendees: [],
  },
  {
    id: 4,
    title: 'Piste · fractionné collectif',
    sport: 'run',
    date: '2026-06-19',
    startTime: '18:30',
    endTime: '20:00',
    location: 'Stade Mangin · piste',
    capacity: 15,
    registeredCount: 7,
    waitlistCount: 0,
    isRegistered: false,
    isWaitlisted: false,
    attendees: [],
  },
]

const SPORT_FILTERS = ['Toutes', 'Natation', 'Vélo', 'Course']
const SPORT_MAP: Record<string, string> = { Natation: 'swim', Vélo: 'bike', Course: 'run' }

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
  return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] }
}

function SportIcon({ sport }: { sport: string }) {
  const icons: Record<string, string> = { swim: '🏊', bike: '🚴', run: '🏃', strength: '💪' }
  return <span>{icons[sport] ?? '🏃'}</span>
}

function SessionCard({
  session,
  onRegister,
  onUnregister,
}: {
  session: ClubSession
  onRegister: (id: number) => void
  onUnregister: (id: number) => void
}) {
  const { day, date, month } = formatDate(session.date)
  const isFull = session.registeredCount >= session.capacity
  const pct = Math.round((session.registeredCount / session.capacity) * 100)
  const remaining = session.capacity - session.registeredCount

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex gap-3 mb-3">
        <div className="text-center flex-none">
          <div className="text-xs font-bold text-gray-400 uppercase">{day}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none">{date}</div>
          <div className="text-xs text-gray-400">{month}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SportIcon sport={session.sport} />
            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{session.title}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-0.5">
            <Clock className="w-3 h-3 flex-none" />
            {session.startTime} – {session.endTime}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="w-3 h-3 flex-none" />
            <span className="truncate">{session.location}</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        {isFull ? (
          <span className="text-xs font-semibold text-red-600">Complet</span>
        ) : (
          <span className="text-xs font-semibold text-teal-600">{remaining} places restantes</span>
        )}
        <span className="text-xs text-gray-400 float-right">
          {session.registeredCount} / {session.capacity} places
        </span>
        <div className="clear-both mt-1">
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-teal-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1">
          {session.attendees.slice(0, 4).map(a => (
            <div
              key={a.id}
              className="w-6 h-6 rounded-full bg-orange-400 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[9px] font-bold"
            >
              {a.firstName[0]}{a.lastName[0]}
            </div>
          ))}
          {session.registeredCount > 4 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-gray-500 text-[9px] font-bold">
              +{session.registeredCount - 4}
            </div>
          )}
        </div>

        {session.isRegistered ? (
          <Button variant="outline" size="sm" onClick={() => onUnregister(session.id)}>
            Se désinscrire
          </Button>
        ) : isFull ? (
          <Button variant="outline" size="sm" onClick={() => onRegister(session.id)}>
            Liste d'attente
          </Button>
        ) : (
          <Button size="sm" onClick={() => onRegister(session.id)}>
            Réserver ma place
          </Button>
        )}
      </div>
    </div>
  )
}

export default function SeancesClubPage() {
  const [activeFilter, setActiveFilter] = useState('Toutes')
  const qc = useQueryClient()

  const sport = activeFilter === 'Toutes' ? undefined : SPORT_MAP[activeFilter]
  const { data, isLoading } = useQuery({
    queryKey: ['club-sessions', sport],
    queryFn: () =>
      seancesClubApi
        .list(sport)
        .then(r => r.data)
        .catch(() => MOCK_SESSIONS),
    initialData: MOCK_SESSIONS,
  })

  const sessions = data ?? MOCK_SESSIONS
  const registeredCount = sessions.filter(s => s.isRegistered).length

  const registerMutation = useMutation({
    mutationFn: (id: number) => seancesClubApi.register(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-sessions'] })
      toast.success('Inscription confirmée !')
    },
    onError: () => toast.error("Erreur lors de l'inscription"),
  })

  const unregisterMutation = useMutation({
    mutationFn: (id: number) => seancesClubApi.unregister(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-sessions'] })
      toast.success('Désinscription effectuée')
    },
  })

  if (isLoading) return <SkeletonDashboard />

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Séances du club</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Annonce des séances collectives · inscris ta présence et réserve ta place
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {SPORT_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-xl font-medium transition-all ${
                activeFilter === f
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800">
          <CheckCircle2 className="w-4 h-4" />
          {registeredCount} séance{registeredCount !== 1 ? 's' : ''} où tu es inscrit
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map(s => (
          <SessionCard
            key={s.id}
            session={s}
            onRegister={id => registerMutation.mutate(id)}
            onUnregister={id => unregisterMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  )
}
