import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MoreVertical, Clock, MapPin } from 'lucide-react'
import { seancesClubApi, type ClubSession } from '@/api/seances-club.api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

const MOCK_SESSIONS: ClubSession[] = [
  { id: 1, title: 'Créneau natation · mardi', sport: 'swim', date: '2026-06-17', startTime: '19:00', endTime: '20:30', location: 'Piscine du Petit Port · lignes 4-5', capacity: 16, registeredCount: 14, waitlistCount: 0, isRegistered: false, isWaitlisted: false, attendees: [] },
  { id: 2, title: 'Créneau natation · jeudi', sport: 'swim', date: '2026-06-19', startTime: '12:30', endTime: '13:45', location: 'Piscine Léo Lagrange · ligne 3', capacity: 8, registeredCount: 8, waitlistCount: 2, isRegistered: false, isWaitlisted: false, attendees: [] },
  { id: 3, title: 'Sortie vélo du dimanche', sport: 'bike', date: '2026-06-22', startTime: '08:00', endTime: '10:30', location: 'Départ local TCN · 70 km', capacity: 20, registeredCount: 11, waitlistCount: 0, isRegistered: false, isWaitlisted: false, attendees: [] },
  { id: 4, title: 'Piste · fractionné collectif', sport: 'run', date: '2026-06-19', startTime: '18:30', endTime: '20:00', location: 'Stade Mangin · piste', capacity: 15, registeredCount: 7, waitlistCount: 0, isRegistered: false, isWaitlisted: false, attendees: [] },
]

const SPORT_ICONS: Record<string, string> = { swim: '🏊', bike: '🚴', run: '🏃', strength: '💪' }
const DISCIPLINES = [
  { key: 'swim', label: 'Natation' },
  { key: 'bike', label: 'Vélo' },
  { key: 'run', label: 'Course' },
  { key: 'strength', label: 'Renfo' },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
  return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] }
}

function CoachSessionCard({ session }: { session: ClubSession }) {
  const { day, date, month } = formatDate(session.date)
  const isFull = session.registeredCount >= session.capacity
  const pct = Math.round((session.registeredCount / session.capacity) * 100)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-3">
          <div className="text-center flex-none">
            <div className="text-xs font-bold text-gray-400 uppercase">{day}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none">{date}</div>
            <div className="text-xs text-gray-400">{month}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span>{SPORT_ICONS[session.sport] ?? '🏃'}</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{session.title}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              <Clock className="w-3 h-3" />{session.startTime} – {session.endTime}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="w-3 h-3" /><span className="truncate">{session.location}</span>
            </div>
          </div>
        </div>
        <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-teal-600'}`}>
            {session.registeredCount} / {session.capacity} inscrits
          </span>
          {session.waitlistCount > 0 && (
            <span className="text-amber-600 font-medium">{session.waitlistCount} en liste d'attente</span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-teal-400'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
        Voir les présents →
      </button>
    </div>
  )
}

interface CreateSessionFormData {
  title: string
  sport: string
  date: string
  startTime: string
  endTime: string
  location: string
  capacity: number
}

function CreateSessionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: CreateSessionFormData) => void }) {
  const [form, setForm] = useState<CreateSessionFormData>({
    title: '', sport: 'swim', date: '', startTime: '', endTime: '', location: '', capacity: 16,
  })

  return (
    <Modal isOpen onClose={onClose} title="Annoncer une séance" size="lg">
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-4">Crée un créneau collectif pour tes athlètes</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Créneau natation · mardi"
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discipline</label>
          <div className="grid grid-cols-4 gap-2">
            {DISCIPLINES.map(d => (
              <button key={d.key} onClick={() => setForm(f => ({ ...f, sport: d.key }))}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  form.sport === d.key ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-slate-700'
                }`}>
                <span className="text-xl">{SPORT_ICONS[d.key]}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacité</label>
            <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 16 }))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Début</label>
            <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin</label>
            <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lieu</label>
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="Piscine du Petit Port · lignes 4-5"
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none" />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={() => { onCreate(form); onClose() }}>Annoncer la séance →</Button>
      </div>
    </Modal>
  )
}

export default function ClubCoachSeancesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['coach-club-sessions'],
    queryFn: () => seancesClubApi.list().then(r => r.data).catch(() => MOCK_SESSIONS),
    initialData: MOCK_SESSIONS,
  })

  const sessions = data ?? MOCK_SESSIONS

  const createMutation = useMutation({
    mutationFn: (d: CreateSessionFormData) => seancesClubApi.create(d as Parameters<typeof seancesClubApi.create>[0]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach-club-sessions'] }); toast.success('Séance annoncée !') },
    onError: () => toast.error('Erreur lors de la création'),
  })

  if (isLoading) return <SkeletonDashboard />

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Séances du club</h1>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
              Semaine 6/12 · saison 2026
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Annonce les séances collectives et gère les places des créneaux
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Annoncer une séance
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map(s => <CoachSessionCard key={s.id} session={s} />)}
      </div>

      {createOpen && (
        <CreateSessionModal
          onClose={() => setCreateOpen(false)}
          onCreate={d => createMutation.mutate(d)}
        />
      )}
    </div>
  )
}
