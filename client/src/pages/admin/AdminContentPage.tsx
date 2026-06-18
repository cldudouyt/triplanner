import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Trash2, FileText, Trophy, Eye, Globe, Lock } from 'lucide-react'
import { adminApi, type ContentPlan, type ContentCompetition } from '@/api/admin.api'
import { Table, Pagination } from '@/components/ui/Table'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/Modal'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { formatDate } from '@/utils/formatDate'

export default function AdminContentPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [contentType, setContentType] = useState<'plans' | 'competitions'>(
    (searchParams.get('type') as 'plans' | 'competitions') || 'plans'
  )
  const [deleteItem, setDeleteItem] = useState<{ type: 'plan' | 'competition'; id: number; name: string } | null>(null)

  useEffect(() => {
    setSearchParams({ type: contentType })
    setPage(1)
  }, [contentType, setSearchParams])

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'content', contentType, page, search],
    queryFn: () => adminApi.listContent({ type: contentType, page, limit: 20, search: search || undefined }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: 'plan' | 'competition'; id: number }) =>
      adminApi.deleteContent(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
      setDeleteItem(null)
    },
  })

  const planColumns = [
    {
      key: 'name',
      header: 'Plan',
      render: (item: ContentPlan) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <FileText className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-500">{item.durationWeeks} semaines</p>
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Auteur',
      render: (item: ContentPlan) => (
        <div className="text-sm">
          <p>{item.user.firstName} {item.user.lastName}</p>
          <p className="text-gray-500">{item.user.email}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: ContentPlan) => (
        <Badge variant="primary">{item.targetType}</Badge>
      ),
    },
    {
      key: 'visibility',
      header: 'Visibilité',
      render: (item: ContentPlan) => (
        <div className="flex items-center gap-2">
          {item.isPublic ? (
            <span className="flex items-center gap-1 text-green-600">
              <Globe className="w-4 h-4" /> Public
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-500">
              <Lock className="w-4 h-4" /> Privé
            </span>
          )}
          {item.isTemplate && (
            <Badge variant="info">Template</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'sessions',
      header: 'Séances',
      render: (item: ContentPlan) => (
        <span className="text-sm">{item._count.sessions}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Créé le',
      render: (item: ContentPlan) => (
        <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: ContentPlan) => (
        <div className="flex items-center gap-2">
          <a
            href={`/training/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            title="Voir"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button
            onClick={() => setDeleteItem({ type: 'plan', id: item.id, name: item.name })}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const competitionColumns = [
    {
      key: 'name',
      header: 'Compétition',
      render: (item: ContentCompetition) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <Trophy className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-500">{item.type} - {item.subType}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Propriétaire',
      render: (item: ContentCompetition) => (
        <div className="text-sm">
          <p>{item.user.firstName} {item.user.lastName}</p>
          <p className="text-gray-500">{item.user.email}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (item: ContentCompetition) => (
        <span className="text-sm">{formatDate(item.date)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (item: ContentCompetition) => {
        const statusVariants: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
          completed: 'success',
          planned: 'primary' as 'default',
          cancelled: 'danger',
        }
        const statusLabels: Record<string, string> = {
          completed: 'Terminée',
          planned: 'Planifiée',
          cancelled: 'Annulée',
        }
        return (
          <Badge variant={statusVariants[item.status] || 'default'}>
            {statusLabels[item.status] || item.status}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: ContentCompetition) => (
        <div className="flex items-center gap-2">
          <a
            href={`/competitions/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            title="Voir"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button
            onClick={() => setDeleteItem({ type: 'competition', id: item.id, name: item.name })}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion du contenu</h1>
        <p className="text-gray-500 mt-1">
          Plans d'entraînement et compétitions
        </p>
      </div>

      <Tabs defaultValue={contentType} onChange={(v) => setContentType(v as 'plans' | 'competitions')}>
        <TabList className="mb-4">
          <Tab value="plans">
            <FileText className="w-4 h-4 inline mr-2" />
            Plans ({contentType === 'plans' ? data?.pagination.total || 0 : '...'})
          </Tab>
          <Tab value="competitions">
            <Trophy className="w-4 h-4 inline mr-2" />
            Compétitions ({contentType === 'competitions' ? data?.pagination.total || 0 : '...'})
          </Tab>
        </TabList>

        <Card padding="none">
          <div className="p-4 border-b border-gray-200">
            <Input
              placeholder={`Rechercher ${contentType === 'plans' ? 'un plan' : 'une compétition'}...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <TabPanel value="plans">
            <Table
              columns={planColumns}
              data={(data?.data || []) as ContentPlan[]}
              keyExtractor={(item) => item.id}
              loading={isLoading}
              emptyMessage="Aucun plan trouvé"
            />
          </TabPanel>

          <TabPanel value="competitions">
            <Table
              columns={competitionColumns}
              data={(data?.data || []) as ContentCompetition[]}
              keyExtractor={(item) => item.id}
              loading={isLoading}
              emptyMessage="Aucune compétition trouvée"
            />
          </TabPanel>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="border-t border-gray-200">
              <Pagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                total={data.pagination.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      </Tabs>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMutation.mutate({ type: deleteItem.type, id: deleteItem.id })}
        title={`Supprimer ${deleteItem?.type === 'plan' ? 'le plan' : 'la compétition'}`}
        message={`Êtes-vous sûr de vouloir supprimer "${deleteItem?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
