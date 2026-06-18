import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Calendar as CalendarIcon, ExternalLink, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { competitionsApi } from '@/api/competitions.api'
import { formatDateLong } from '@/utils/formatDate'
import PriorityBadge from '@/components/competitions/PriorityBadge'
import EquipmentChecklist from '@/components/competitions/EquipmentChecklist'
import RaceAnalysisPanel from '@/components/competitions/RaceAnalysisPanel'
import { STATUSES, SPORT_COLORS } from '@/utils/constants'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useState } from 'react'

export default function CompetitionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState(false)

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition', id],
    queryFn: () => competitionsApi.get(Number(id)).then(r => r.data),
  })

  const handleDelete = async () => {
    if (!confirm('Supprimer cette compétition ?')) return
    setDeleting(true)
    await competitionsApi.delete(Number(id))
    navigate('/competitions')
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl animate-fade-in">
        <SkeletonCard className="h-8 w-24 mb-4" />
        <SkeletonCard className="h-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-32" />
          </div>
          <SkeletonCard className="h-64" />
        </div>
      </div>
    )
  }

  if (!competition) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Compétition non trouvée</div>
  }

  const status = STATUSES.find(s => s.value === competition.status)

  return (
    <div className="max-w-4xl animate-fade-in">
      <button onClick={() => navigate('/competitions')} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{competition.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <PriorityBadge priority={competition.priority} />
            {status && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {status.label}
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {competition.type === 'triathlon' ? 'Triathlon' : 'Course'} - {competition.subType}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to={`/competitions/${id}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Edit className="h-4 w-4" /> Modifier
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm">{formatDateLong(competition.date)}</span>
              </div>
              {competition.location && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm">{competition.location}</span>
                </div>
              )}
            </div>

            {/* Distances */}
            {(competition.swimDistance || competition.bikeDistance || competition.runDistance) && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Distances</h3>
                <div className="flex gap-4">
                  {competition.swimDistance && (
                    <span className="text-sm" style={{ color: SPORT_COLORS.swim.color }}>
                      🏊 Natation: {(competition.swimDistance / 1000).toFixed(1)}km
                    </span>
                  )}
                  {competition.bikeDistance && (
                    <span className="text-sm" style={{ color: SPORT_COLORS.bike.color }}>
                      🚴 Vélo: {(competition.bikeDistance / 1000).toFixed(1)}km
                    </span>
                  )}
                  {competition.runDistance && (
                    <span className="text-sm" style={{ color: SPORT_COLORS.run.color }}>
                      🏃 Course: {(competition.runDistance / 1000).toFixed(1)}km
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Chrono */}
            {(competition.chronoObjective || competition.result) && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Temps</h3>
                <div className="flex gap-6">
                  {competition.chronoObjective && (
                    <div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Objectif</span>
                      <p className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100">{competition.chronoObjective}</p>
                    </div>
                  )}
                  {competition.result && (
                    <div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Résultat</span>
                      <p className="text-lg font-mono font-semibold text-green-600 dark:text-green-400">{competition.result}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {competition.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{competition.notes}</p>
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <RaceAnalysisPanel
            competitionId={competition.id}
            canAnalyze={competition.status === 'completed' && !!competition.result}
          />

          {/* Logistics */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Logistique</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {competition.budget && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Budget</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{competition.budget} EUR</p>
                </div>
              )}
              {competition.accommodation && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Hébergement</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{competition.accommodation}</p>
                </div>
              )}
              {competition.transport && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Transport</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{competition.transport}</p>
                </div>
              )}
              {competition.registrationLink && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Inscription</span>
                  <a
                    href={competition.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    Lien <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <EquipmentChecklist
            competitionId={competition.id}
            items={competition.equipmentItems}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ['competition', id] })}
          />
        </div>
      </div>
    </div>
  )
}
