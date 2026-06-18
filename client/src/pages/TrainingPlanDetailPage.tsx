import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Plus, X, Share2, Link, EyeOff, Globe } from 'lucide-react'
import { trainingPlansApi, sessionsApi, type TrainingSession } from '@/api/trainingPlans.api'
import { formatDate } from '@/utils/formatDate'
import { SESSION_TYPES, INTENSITIES, LEVELS } from '@/utils/constants'
import { useState } from 'react'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const LEVEL_BADGE_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-purple-100 text-purple-800',
}

function getPhaseFromDescription(description?: string): string | null {
  if (!description) return null
  const match = description.match(/^\[(Base|Construction|Pic|Affutage)\]/)
  return match ? match[1] : null
}

const PHASE_COLORS: Record<string, string> = {
  Base: 'bg-gray-100 text-gray-700',
  Construction: 'bg-blue-100 text-blue-700',
  Pic: 'bg-orange-100 text-orange-700',
  Affutage: 'bg-green-100 text-green-700',
}

function SessionCard({ session, onToggle, onDelete, onShowDetail }: {
  session: TrainingSession
  onToggle: () => void
  onDelete: () => void
  onShowDetail: () => void
}) {
  const typeConfig = SESSION_TYPES.find(t => t.value === session.type)
  const intensityConfig = INTENSITIES.find(i => i.value === session.intensity)

  // Get first meaningful line of description for preview
  const descriptionPreview = session.description
    ? session.description.replace(/^\[.*?\]\s*/, '').split('\n')[0]
    : null

  return (
    <div
      className={`p-2 rounded-lg border text-xs group cursor-pointer ${
        session.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
      }`}
      onClick={onShowDetail}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium" style={{ color: typeConfig?.color }}>
          {typeConfig?.icon} {typeConfig?.label || session.type}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onToggle() }} className="text-gray-400 hover:text-green-500" title="Marquer comme fait">
            {session.completed ? '↩' : '✓'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-gray-400 hover:text-red-500">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {session.title && <p className="text-gray-700 truncate">{session.title}</p>}
      <div className="flex gap-2 mt-1 text-gray-400">
        {session.duration && <span>{session.duration}min</span>}
        {session.distance && <span>{(session.distance / 1000).toFixed(1)}km</span>}
      </div>
      {intensityConfig && (
        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${intensityConfig.color}`}>
          {intensityConfig.label}
        </span>
      )}
      {descriptionPreview && (
        <p className="text-[10px] text-gray-400 mt-1 truncate">{descriptionPreview}</p>
      )}
    </div>
  )
}

function SessionDetailModal({ session, onClose }: {
  session: TrainingSession
  onClose: () => void
}) {
  const typeConfig = SESSION_TYPES.find(t => t.value === session.type)
  const intensityConfig = INTENSITIES.find(i => i.value === session.intensity)

  // Parse the description to extract structured parts
  const rawDescription = session.description?.replace(/^\[.*?\]\s*/, '') || ''
  const lines = rawDescription.split('\n').filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg" style={{ color: typeConfig?.color }}>
              {typeConfig?.icon}
            </span>
            <h2 className="text-lg font-semibold text-gray-900">{session.title || typeConfig?.label}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            {intensityConfig && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${intensityConfig.color}`}>
                {intensityConfig.label}
              </span>
            )}
            {session.duration && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {session.duration} min
              </span>
            )}
            {session.distance && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {(session.distance / 1000).toFixed(1)} km
              </span>
            )}
            {session.date && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {formatDate(session.date)}
              </span>
            )}
          </div>

          {/* Structured description */}
          {lines.length > 0 && (
            <div className="space-y-3">
              {lines.map((line, idx) => {
                const colonIdx = line.indexOf(' : ')
                if (colonIdx === -1) {
                  return <p key={idx} className="text-sm text-gray-600">{line}</p>
                }
                const label = line.substring(0, colonIdx).trim()
                const content = line.substring(colonIdx + 3).trim()

                const iconMap: Record<string, string> = {
                  'Objectif': '🎯',
                  'Echauffement': '🔥',
                  'Seance': '💪',
                  'Retour au calme': '🧘',
                  'Conseil': '💡',
                }
                const icon = iconMap[label] || '📝'

                return (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{icon}</span>
                      <span className="text-sm font-semibold text-gray-700">{label}</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{content}</p>
                  </div>
                )
              })}
            </div>
          )}

          {!lines.length && session.description && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{session.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TrainingPlanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [addingSession, setAddingSession] = useState<{ week: number; day: number } | null>(null)
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [makePublic, setMakePublic] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: plan, isLoading } = useQuery({
    queryKey: ['training-plan', id],
    queryFn: () => trainingPlansApi.get(Number(id)).then(r => r.data),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['training-plan', id] })

  const shareMutation = useMutation({
    mutationFn: () => trainingPlansApi.share(Number(id), makePublic),
    onSuccess: () => refresh(),
  })

  const revokeMutation = useMutation({
    mutationFn: () => trainingPlansApi.revokeShare(Number(id)),
    onSuccess: () => { refresh(); setShareDialogOpen(false) },
  })

  const handleCopyLink = async (shareCode: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/plans/shared/${shareCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleSession = async (session: TrainingSession) => {
    await sessionsApi.update(session.id, { completed: !session.completed })
    refresh()
  }

  const deleteSession = async (sessionId: number) => {
    if (!confirm('Supprimer cette seance ?')) return
    await sessionsApi.delete(sessionId)
    refresh()
  }

  const deletePlan = async () => {
    if (!confirm('Supprimer ce plan et toutes ses seances ?')) return
    await trainingPlansApi.delete(Number(id))
    navigate('/training')
  }

  const handleAddSession = async (data: any) => {
    await sessionsApi.create({
      planId: Number(id),
      weekNumber: data.weekNumber,
      dayOfWeek: data.dayOfWeek,
      type: data.type,
      title: data.title,
      duration: data.duration ? Number(data.duration) : undefined,
      intensity: data.intensity,
    })
    setAddingSession(null)
    refresh()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!plan) {
    return <div className="text-center py-12 text-gray-500">Plan non trouve</div>
  }

  // Group sessions by week
  const weeks: Record<number, TrainingSession[]> = {}
  for (let w = 1; w <= plan.durationWeeks; w++) {
    weeks[w] = plan.sessions.filter(s => s.weekNumber === w)
  }

  const totalSessions = plan.sessions.length
  const completedSessions = plan.sessions.filter(s => s.completed).length
  const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  const levelConfig = LEVELS.find(l => l.value === plan.level)

  // Determine phase per week from first session's description
  function getWeekPhase(sessions: TrainingSession[]): string | null {
    for (const s of sessions) {
      const phase = getPhaseFromDescription(s.description)
      if (phase) return phase
    }
    return null
  }

  return (
    <div>
      <button onClick={() => navigate('/training')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
            {levelConfig && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${LEVEL_BADGE_COLORS[plan.level || ''] || 'bg-gray-100 text-gray-700'}`}>
                {levelConfig.label}
              </span>
            )}
          </div>
          {plan.competitions && plan.competitions.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase">Objectifs</p>
              {plan.competitions.map(pc => (
                <div key={pc.id} className="flex items-center gap-2 text-sm">
                  {pc.isPrimary && <span className="text-yellow-500">*</span>}
                  <span className={pc.isPrimary ? 'text-blue-600 font-medium' : 'text-gray-600'}>
                    {pc.competition.name}
                  </span>
                  <span className="text-gray-400">
                    {formatDate(pc.competition.date)}
                  </span>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                    pc.competition.priority === 'A' ? 'bg-red-100 text-red-700' :
                    pc.competition.priority === 'B' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {pc.competition.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
          {plan.description && <p className="text-sm text-gray-500 mt-2">{plan.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShareDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
          >
            <Share2 className="h-4 w-4" /> Partager
          </button>
          <button
            onClick={deletePlan}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm text-gray-500">{completedSessions}/{totalSessions} seances ({progress}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        {plan.startDate && (
          <p className="text-xs text-gray-400 mt-2">
            {formatDate(plan.startDate)} - {plan.endDate ? formatDate(plan.endDate) : '...'}
          </p>
        )}
      </div>

      {/* Week by week view */}
      <div className="space-y-6">
        {Object.entries(weeks).map(([weekStr, sessions]) => {
          const week = Number(weekStr)
          const weekCompleted = sessions.filter(s => s.completed).length
          const weekPhase = getWeekPhase(sessions)
          return (
            <div key={week} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Semaine {week}</h3>
                  {weekPhase && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PHASE_COLORS[weekPhase] || 'bg-gray-100 text-gray-700'}`}>
                      {weekPhase}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{weekCompleted}/{sessions.length} seances</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day, idx) => {
                  const daySessions = sessions.filter(s => s.dayOfWeek === idx + 1)
                  return (
                    <div key={idx} className="min-h-[80px]">
                      <p className="text-xs font-medium text-gray-400 mb-1 text-center">{day}</p>
                      <div className="space-y-1">
                        {daySessions.map(s => (
                          <SessionCard
                            key={s.id}
                            session={s}
                            onToggle={() => toggleSession(s)}
                            onDelete={() => deleteSession(s.id)}
                            onShowDetail={() => setSelectedSession(s)}
                          />
                        ))}
                        <button
                          onClick={() => setAddingSession({ week, day: idx + 1 })}
                          className="w-full p-1 text-gray-300 hover:text-blue-500 rounded border border-dashed border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <Plus className="h-3 w-3 mx-auto" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add session modal */}
      {addingSession && (
        <AddSessionModal
          week={addingSession.week}
          day={addingSession.day}
          onClose={() => setAddingSession(null)}
          onSave={handleAddSession}
        />
      )}

      {/* Session detail modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}

      {/* Share dialog */}
      {shareDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShareDialogOpen(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Partager le plan
              </h2>
              <button onClick={() => setShareDialogOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {plan.shareCode ? (
              /* Already shared — show the link */
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Ce plan est partagé. Copiez le lien ci-dessous pour le partager.
                </p>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2">
                  <Link className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                    {window.location.origin}/plans/shared/{plan.shareCode}
                  </span>
                  <button
                    onClick={() => handleCopyLink(plan.shareCode!)}
                    className="shrink-0 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                {plan.isPublic && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    Visible dans la galerie publique
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => revokeMutation.mutate()}
                    disabled={revokeMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition-colors"
                  >
                    <EyeOff className="h-4 w-4" />
                    {revokeMutation.isPending ? 'Révocation...' : 'Révoquer le partage'}
                  </button>
                </div>
              </div>
            ) : (
              /* Not yet shared — let user generate a link */
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Générez un lien pour partager ce plan avec d'autres triathlètes.
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={makePublic}
                    onChange={e => setMakePublic(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Rendre public (visible dans la galerie de plans)
                  </span>
                </label>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShareDialogOpen(false)}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => shareMutation.mutate()}
                    disabled={shareMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    {shareMutation.isPending ? 'Génération...' : 'Générer un lien'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AddSessionModal({ week, day, onClose, onSave }: {
  week: number
  day: number
  onClose: () => void
  onSave: (data: any) => void
}) {
  const [type, setType] = useState('run')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState('moderate')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ajouter une seance - S{week} {DAYS[day - 1]}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {SESSION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duree (min)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intensite</label>
            <select value={intensity} onChange={e => setIntensity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {INTENSITIES.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button
            onClick={() => onSave({ weekNumber: week, dayOfWeek: day, type, title, duration, intensity })}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}
