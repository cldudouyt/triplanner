import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Upload, Filter, List, Map } from 'lucide-react'
import { competitionsApi, type CompetitionFilters } from '@/api/competitions.api'
import CompetitionCard from '@/components/competitions/CompetitionCard'
import CompetitionsMap from '@/components/competitions/CompetitionsMap'
import ImportModal from '@/components/competitions/ImportModal'
import { COMPETITION_TYPES, PRIORITIES, STATUSES } from '@/utils/constants'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import clsx from 'clsx'

export default function CompetitionsPage() {
  const [importOpen, setImportOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filters, setFilters] = useState<CompetitionFilters>({
    sortBy: 'date',
    sortOrder: 'asc',
    page: 1,
    limit: 20,
  })

  // En vue carte, charger toutes les competitions (pas de pagination)
  const queryFilters = {
    ...filters,
    ...(viewMode === 'map' ? { limit: 500, page: 1 } : {}),
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['competitions', queryFilters],
    queryFn: () => competitionsApi.list(queryFilters).then(r => r.data),
  })

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compétitions</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{data?.total || 0} compétition(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'flex items-center gap-1 px-3 py-2 text-sm transition-colors',
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              )}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={clsx(
                'flex items-center gap-1 px-3 py-2 text-sm transition-colors',
                viewMode === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              )}
            >
              <Map className="h-4 w-4" />
              Carte
            </button>
          </div>
          <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filtres
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Importer
          </button>
          <Link
            to="/competitions/new"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle
          </Link>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          <select
            value={filters.type || ''}
            onChange={e => setFilters({ ...filters, type: e.target.value || undefined, page: 1 })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="" className="dark:bg-slate-700">Tous les types</option>
            {COMPETITION_TYPES.map(t => (
              <option key={t.value} value={t.value} className="dark:bg-slate-700">{t.label}</option>
            ))}
          </select>
          <select
            value={filters.priority || ''}
            onChange={e => setFilters({ ...filters, priority: e.target.value || undefined, page: 1 })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="" className="dark:bg-slate-700">Toutes priorités</option>
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value} className="dark:bg-slate-700">{p.label}</option>
            ))}
          </select>
          <select
            value={filters.status || ''}
            onChange={e => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="" className="dark:bg-slate-700">Tous statuts</option>
            {STATUSES.map(s => (
              <option key={s.value} value={s.value} className="dark:bg-slate-700">{s.label}</option>
            ))}
          </select>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={e => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [string, 'asc' | 'desc']
              setFilters({ ...filters, sortBy, sortOrder })
            }}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="date-asc" className="dark:bg-slate-700">Date (croissant)</option>
            <option value="date-desc" className="dark:bg-slate-700">Date (décroissant)</option>
            <option value="name-asc" className="dark:bg-slate-700">Nom (A-Z)</option>
            <option value="priority-asc" className="dark:bg-slate-700">Priorité</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <EmptyState
          variant="competitions"
          action={{
            label: 'Ajouter une compétition',
            href: '/competitions/new',
          }}
        />
      ) : viewMode === 'map' ? (
        <CompetitionsMap competitions={data.data} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data.map(comp => (
              <CompetitionCard key={comp.id} competition={comp} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setFilters({ ...filters, page })}
                  className={clsx(
                    'px-3 py-1 text-sm rounded transition-colors',
                    page === data.page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
