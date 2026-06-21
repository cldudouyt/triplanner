import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { trainingPlansApi, sessionsApi } from '@/api/trainingPlans.api'

interface Props {
  onClose: () => void
}

const DISCIPLINES = [
  { key: 'swim', label: 'Natation', icon: '🏊' },
  { key: 'bike', label: 'Vélo', icon: '🚴' },
  { key: 'run', label: 'Course', icon: '🏃' },
  { key: 'strength', label: 'Renfo', icon: '💪' },
]

const SESSION_TYPES = [
  { label: 'Endurance', intensity: 'easy' },
  { label: 'Seuil', intensity: 'moderate' },
  { label: 'VMA / Intervalles', intensity: 'interval' },
  { label: 'Technique', intensity: 'moderate' },
  { label: 'Récupération', intensity: 'easy' },
]

const DISCIPLINE_LABELS: Record<string, string> = {
  swim: 'Natation', bike: 'Vélo', run: 'Course', strength: 'Renfo',
}

function parseDurationMinutes(str: string): number {
  const match = str.match(/(\d+)h(\d+)?/)
  if (!match) {
    const mins = parseInt(str)
    return isNaN(mins) ? 60 : mins
  }
  return parseInt(match[1]) * 60 + parseInt(match[2] ?? '0')
}

function calcWeekNumber(startDate: string, sessionDate: string): number {
  const diffDays = Math.floor(
    (new Date(sessionDate).getTime() - new Date(startDate).getTime()) / 86400000
  )
  return Math.max(1, Math.floor(diffDays / 7) + 1)
}

function calcDayOfWeek(dateStr: string): number {
  const day = new Date(dateStr).getDay()
  return day === 0 ? 7 : day
}

export default function NewSessionModal({ onClose }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [discipline, setDiscipline] = useState('run')
  const [date, setDate] = useState(today)
  const [duration, setDuration] = useState('1h00')
  const [sessionType, setSessionType] = useState('Endurance')
  const [notes, setNotes] = useState('')

  const queryClient = useQueryClient()

  const { data: plansData } = useQuery({
    queryKey: ['training-plans'],
    queryFn: () => trainingPlansApi.list().then(r => r.data),
  })

  const activePlan = plansData?.data?.find(p => !p.isTemplate) ?? plansData?.data?.[0]

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!activePlan) throw new Error('no-plan')
      const intensity = SESSION_TYPES.find(t => t.label === sessionType)?.intensity ?? 'easy'
      return sessionsApi.create({
        planId: activePlan.id,
        weekNumber: activePlan.startDate ? calcWeekNumber(activePlan.startDate, date) : 1,
        dayOfWeek: calcDayOfWeek(date),
        date,
        type: discipline,
        title: `${DISCIPLINE_LABELS[discipline]} — ${sessionType}`,
        description: notes || undefined,
        duration: parseDurationMinutes(duration),
        intensity,
      })
    },
    onSuccess: () => {
      toast.success('Séance ajoutée')
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['training-plans'] })
      onClose()
    },
    onError: (err: Error) => {
      if (err.message === 'no-plan') {
        toast.error("Crée d'abord un plan d'entraînement")
      } else {
        toast.error("Erreur lors de l'ajout de la séance")
      }
    },
  })

  return (
    <Modal isOpen onClose={onClose} title="Nouvelle séance" size="lg">
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-4">
        {activePlan
          ? `Plan : ${activePlan.name}`
          : "Aucun plan actif — crée un plan d'abord"}
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Discipline
        </label>
        <div className="grid grid-cols-4 gap-2">
          {DISCIPLINES.map(d => (
            <button
              key={d.key}
              onClick={() => setDiscipline(d.key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                discipline === d.key
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              <span className="text-xl">{d.icon}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Durée
          </label>
          <input
            type="text"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="1h00"
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type de séance
        </label>
        <div className="flex flex-wrap gap-2">
          {SESSION_TYPES.map(t => (
            <button
              key={t.label}
              onClick={() => setSessionType(t.label)}
              className={`px-3 py-1.5 text-sm rounded-xl border transition-all ${
                sessionType === t.label
                  ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Objectif, allures cibles, ressenti attendu..."
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-300 outline-none resize-none"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button loading={isPending} onClick={() => mutate()}>
          Enregistrer →
        </Button>
      </div>
    </Modal>
  )
}
