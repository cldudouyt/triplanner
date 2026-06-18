import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Shield, ShieldOff, Trash2, Eye, Edit2, X, Check } from 'lucide-react'
import { adminApi, type AdminUser } from '@/api/admin.api'
import { Table, Pagination } from '@/components/ui/Table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatDate'

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', isAdmin: false })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => adminApi.listUsers({ page, limit: 20, search: search || undefined }).then(r => r.data),
  })

  const { data: userDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['admin', 'user', selectedUser?.id],
    queryFn: () => selectedUser ? adminApi.getUser(selectedUser.id).then(r => r.data) : null,
    enabled: !!selectedUser,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminApi.updateUser>[1] }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'user'] })
      setEditingUser(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setDeleteUser(null)
    },
  })

  const handleEdit = (user: AdminUser) => {
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
    })
    setEditingUser(user)
  }

  const handleSaveEdit = () => {
    if (!editingUser) return
    updateMutation.mutate({ id: editingUser.id, data: editForm })
  }

  const handleToggleAdmin = (user: AdminUser) => {
    updateMutation.mutate({ id: user.id, data: { isAdmin: !user.isAdmin } })
  }

  const columns = [
    {
      key: 'user',
      header: 'Utilisateur',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (user: AdminUser) => (
        <Badge variant={user.isAdmin ? 'warning' : 'default'}>
          {user.isAdmin ? 'Admin' : 'Utilisateur'}
        </Badge>
      ),
    },
    {
      key: 'stats',
      header: 'Activité',
      render: (user: AdminUser) => (
        <div className="text-sm">
          <p>{user._count.trainingPlans} plans</p>
          <p className="text-gray-500">{user._count.competitions} compétitions</p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Inscription',
      render: (user: AdminUser) => (
        <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedUser(user) }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            title="Voir détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(user) }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleAdmin(user) }}
            className={`p-1.5 rounded-lg hover:bg-gray-100 ${user.isAdmin ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500'}`}
            title={user.isAdmin ? 'Retirer admin' : 'Promouvoir admin'}
          >
            {user.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteUser(user) }}
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
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="text-gray-500 mt-1">
          {data?.pagination.total || 0} utilisateurs enregistrés
        </p>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-gray-200">
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <Table
          columns={columns}
          data={data?.data || []}
          keyExtractor={(user) => user.id}
          loading={isLoading}
          emptyMessage="Aucun utilisateur trouvé"
        />

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

      {/* User detail modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Détails utilisateur"
        size="lg"
      >
        {loadingDetail ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : userDetail ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-medium">
                {userDetail.firstName[0]}{userDetail.lastName[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {userDetail.firstName} {userDetail.lastName}
                </h3>
                <p className="text-gray-500">{userDetail.email}</p>
                <Badge variant={userDetail.isAdmin ? 'warning' : 'default'} className="mt-1">
                  {userDetail.isAdmin ? 'Administrateur' : 'Utilisateur'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">
                  {userDetail._count.trainingPlans}
                </p>
                <p className="text-sm text-gray-500">Plans</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">
                  {userDetail._count.competitions}
                </p>
                <p className="text-sm text-gray-500">Compétitions</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">
                  {userDetail._count.refreshTokens}
                </p>
                <p className="text-sm text-gray-500">Sessions actives</p>
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>Inscrit le {formatDate(userDetail.createdAt)}</p>
              <p>Dernière modification le {formatDate(userDetail.updatedAt)}</p>
            </div>

            {userDetail.trainingPlans.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Derniers plans</h4>
                <div className="space-y-2">
                  {userDetail.trainingPlans.slice(0, 5).map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <span className="text-sm">{plan.name}</span>
                      <span className="text-xs text-gray-500">{plan.targetType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Edit user modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Modifier l'utilisateur"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Prénom"
            value={editForm.firstName}
            onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))}
          />
          <Input
            label="Nom"
            value={editForm.lastName}
            onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.isAdmin}
              onChange={(e) => setEditForm(f => ({ ...f, isAdmin: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Administrateur</span>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} loading={updateMutation.isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteUser?.firstName} ${deleteUser?.lastName} ? Cette action est irréversible et supprimera toutes ses données.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
