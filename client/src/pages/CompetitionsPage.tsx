import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Bell } from 'lucide-react'
import api from '@/api/client'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'

const TP_TOOLTIP_KEY = 'tp_tooltip_comp'
const TOOLTIP_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function shouldShowTooltip(): boolean {
  const stored = localStorage.getItem(TP_TOOLTIP_KEY)
  if (!stored) return true
  return Date.now() - parseInt(stored, 10) > TOOLTIP_TTL_MS
}

function formatDistance(meters?: number | null): string | null {
  if (!meters) return null
  if (meters >= 1000) {
    const km = meters / 1000
    return km % 1 === 0 ? `${km}km` : `${km.toFixed(1)}km`
  }
  return `${meters}m`
}

const PRIORITY_GRADIENT = {
  A: 'linear-gradient(135deg,#EF4444 0%,#DC2626 100%)',
  B: 'linear-gradient(135deg,#FB923C 0%,#EA580C 100%)',
  C: 'linear-gradient(135deg,#334155 0%,#1E293B 100%)',
} as const

const PRIORITY_LABEL = { A: 'OBJECTIF A', B: 'OBJECTIF B', C: 'OBJECTIF C' } as const

export default function CompetitionsPage() {
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: competitions, isLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: () =>
      api
        .get('/competitions')
        .then(r => (Array.isArray(r.data) ? r.data : r.data?.data ?? []))
        .catch(() => []),
  })

  // Show tooltip on first usage (no competitions + not dismissed in last 7 days)
  useEffect(() => {
    if (!isLoading && Array.isArray(competitions) && competitions.length === 0 && shouldShowTooltip()) {
      setShowTooltip(true)
      tooltipTimerRef.current = setTimeout(() => {
        setShowTooltip(false)
      }, 5000)
    }
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    }
  }, [isLoading, competitions])

  const handleAddCompetitionClick = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    setShowTooltip(false)
    localStorage.setItem(TP_TOOLTIP_KEY, Date.now().toString())
    navigate('/competitions/new')
  }

  const { data: completedComps } = useQuery({
    queryKey: ['competitions', 'completed'],
    queryFn: () =>
      api
        .get('/competitions?status=completed')
        .then(r => (Array.isArray(r.data) ? r.data : r.data?.data ?? []))
        .catch(() => []),
  })

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-40 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-56 bg-gray-100 dark:bg-slate-700/60 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Pour chaque priorité, prendre la prochaine compétition (date >= aujourd'hui)
  const compsArray = Array.isArray(competitions) ? competitions : []
  const priorityMap = (['A', 'B', 'C'] as const).map(p => ({
    priority: p,
    comp: compsArray.find((c: any) => c.priority === p && new Date(c.date) >= new Date()) ?? null,
  }))

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compétitions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tes objectifs de saison et résultats</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Rechercher une compétition..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 focus:outline-none w-52"
            />
          </div>
          <button className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          <div className="relative">
            {showTooltip && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full pointer-events-none z-10 animate-fade-in">
                Nouveau ✨
              </span>
            )}
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={handleAddCompetitionClick}
            >
              Compétition
            </Button>
          </div>
        </div>
      </div>

      {/* Objectifs de saison */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Objectifs de saison</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {priorityMap.map(({ priority, comp }) => {
            if (!comp) return (
              <div
                key={priority}
                className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-5 flex items-center justify-center min-h-[220px] cursor-pointer hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                onClick={() => setShowCreate(true)}
              >
                <p className="text-sm text-gray-400">+ Objectif {priority}</p>
              </div>
            )

            const days = Math.ceil((new Date(comp.date).getTime() - Date.now()) / 86400000)
            const dateStr = new Date(comp.date)
              .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
              .toUpperCase()
            const STATUS = {
              registered: { dot: 'bg-emerald-400', label: 'Inscrit' },
              planned: { dot: 'bg-amber-400', label: 'Planifié' },
              dns: { dot: 'bg-gray-400', label: 'Dossard à venir' },
            }
            const status = STATUS[comp.status as keyof typeof STATUS] || { dot: 'bg-gray-400', label: comp.status }

            return (
              <div
                key={priority}
                className="relative rounded-2xl p-5 overflow-hidden cursor-pointer"
                style={{ background: PRIORITY_GRADIENT[priority] }}
                onClick={() => navigate(`/competitions/${comp.id}`)}
              >
                {/* Orbe */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                      {PRIORITY_LABEL[priority]}
                    </span>
                    <div className="text-right">
                      <div className="bg-white/25 rounded-lg px-2 py-1 inline-block">
                        <p className="text-xs font-bold text-white">J-{days}</p>
                      </div>
                      <p className="text-[10px] text-white/60 mt-0.5">{dateStr}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 leading-tight">{comp.name}</h3>
                  <p className="text-sm text-white/70 mb-4">{comp.city || comp.location || ''}, FR</p>
                  {/* Statut */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                    <span className="text-sm text-white">{status.label}</span>
                    <span className="text-white/40">·</span>
                    <span className="text-sm text-white/70 capitalize">{comp.subType || comp.type}</span>
                  </div>
                  {/* Distances */}
                  {(comp.swimDistance || comp.bikeDistance || comp.runDistance) && (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20">
                      {[
                        { label: 'NAT', value: formatDistance(comp.swimDistance), color: '#06B6D4' },
                        { label: 'VÉLO', value: formatDistance(comp.bikeDistance), color: '#10B981' },
                        { label: 'C.À.P', value: formatDistance(comp.runDistance), color: '#F97316' },
                      ]
                        .filter(d => d.value)
                        .map(({ label, value, color }) => (
                          <div key={label} className="text-center">
                            <p className="text-[10px] uppercase text-white/50 mb-0.5 flex items-center justify-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ backgroundColor: color }}
                              />
                              {label}
                            </p>
                            <p className="text-sm font-bold font-mono text-white">{value}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Résultats récents */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Résultats récents</h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                {['COURSE', 'FORMAT', 'TEMPS', 'ALLURE C.À.P', 'RANG'].map(h => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {(Array.isArray(completedComps) ? completedComps : []).map((comp: any) => (
                <tr
                  key={comp.id}
                  className="hover:bg-orange-50/30 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/competitions/${comp.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{comp.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(comp.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 capitalize">
                    {comp.subType || comp.type}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {comp.finishTime || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                    {comp.runPace || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {comp.rank ? (
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{comp.rank}e</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {!(Array.isArray(completedComps) ? completedComps : []).length && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                    Aucun résultat pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création rapide */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Ajouter une compétition
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Renseigne ta prochaine compétition pour suivre ta préparation.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  setShowCreate(false)
                  navigate('/competitions/new')
                }}
              >
                Créer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
