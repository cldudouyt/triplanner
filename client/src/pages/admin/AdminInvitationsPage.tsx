import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, X, Send, UserPlus, Info } from 'lucide-react'
import { adminCoachApi, type AdminInvitation } from '@/api/admin.api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

const MOCK_INVITATIONS: AdminInvitation[] = [
  { id: 1, email: 'camille.durand@email.fr', firstName: 'Camille', lastName: 'Durand', role: 'athlete', groupName: 'Découverte', createdAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 518400000).toISOString(), status: 'pending' },
  { id: 2, email: 'noe.renaud@email.fr', firstName: 'Noé', lastName: 'Renaud', role: 'athlete', groupName: null, createdAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: new Date(Date.now() + 518400000).toISOString(), status: 'pending' },
  { id: 3, email: 'hugo.masson@email.fr', firstName: 'Hugo', lastName: 'Masson', role: 'coach', groupName: null, createdAt: new Date(Date.now() - 259200000).toISOString(), expiresAt: new Date(Date.now() + 518400000).toISOString(), status: 'pending' },
]

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 3600000) return `il y a ${Math.round(diff / 60000)}min`
  if (diff < 86400000) return `il y a ${Math.round(diff / 3600000)}h`
  return `${Math.round(diff / 86400000)} j`
}

const GROUPS = ['Découverte', 'Endurance Loisir', 'Compétition', 'Longue Distance']
const ROLES = [
  { key: 'athlete', label: 'Membre', desc: 'Par défaut' },
  { key: 'coach', label: 'Coach', desc: 'Accès coach' },
  { key: 'admin', label: 'Admin CODIR', desc: 'Accès CODIR' },
]

interface InviteFormData {
  firstName: string
  lastName: string
  email: string
  groupName?: string
  role: string
}

function InviteMemberModal({ onClose, onInvite }: { onClose: () => void; onInvite: (data: InviteFormData) => void }) {
  const [form, setForm] = useState<InviteFormData>({ firstName: '', lastName: '', email: '', role: 'athlete' })

  return (
    <Modal isOpen onClose={onClose} title="Inviter un membre" size="lg">
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-5">
        Un e-mail d'invitation sera envoyé pour créer le compte
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
          <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            placeholder="Camille"
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-300 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
          <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
            placeholder="Durand"
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-300 outline-none" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse e-mail</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="camille.durand@email.fr"
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-300 outline-none" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Groupe d'entraînement</label>
        <div className="flex flex-wrap gap-2">
          {GROUPS.map(g => (
            <button key={g} onClick={() => setForm(f => ({ ...f, groupName: f.groupName === g ? undefined : g }))}
              className={`px-3 py-1.5 text-sm rounded-xl border transition-all ${
                form.groupName === g
                  ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-500 text-violet-700 dark:text-violet-300'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}>{g}</button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Droits attribués</label>
        <div className="space-y-2">
          {ROLES.map(r => (
            <button key={r.key} onClick={() => setForm(f => ({ ...f, role: r.key }))}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                form.role === r.key
                  ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-400 dark:border-violet-600'
                  : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
              }`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none ${
                form.role === r.key ? 'border-violet-600 bg-violet-600' : 'border-gray-300 dark:border-slate-600'
              }`}>
                {form.role === r.key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.label}</div>
                <div className="text-xs text-gray-400">{r.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <button
          onClick={() => { onInvite(form); onClose() }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
          <Send className="w-4 h-4" />
          Envoyer l'invitation
        </button>
      </div>
    </Modal>
  )
}

export default function AdminInvitationsPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-invitations'],
    queryFn: () => adminCoachApi.getInvitations().then(r => r.data).catch(() => MOCK_INVITATIONS),
    initialData: MOCK_INVITATIONS,
  })

  const invitations = data ?? MOCK_INVITATIONS

  const inviteMutation = useMutation({
    mutationFn: (d: InviteFormData) => adminCoachApi.createInvitation(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-invitations'] })
      toast.success('Invitation envoyée !')
    },
    onError: () => toast.error("Erreur lors de l'envoi"),
  })

  const resendMutation = useMutation({
    mutationFn: (id: number) => adminCoachApi.resendInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-invitations'] })
      toast.success('Invitation relancée')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminCoachApi.deleteInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-invitations'] })
      toast.success('Invitation supprimée')
    },
  })

  if (isLoading) return <SkeletonDashboard />

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Invitations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Invite les nouveaux membres et suis les invitations en attente
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
          <UserPlus className="w-4 h-4" />
          Inviter un membre
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 mb-6 text-sm text-gray-600 dark:text-gray-400">
        <Info className="w-4 h-4 mt-0.5 flex-none text-gray-400" />
        Invitations envoyées aux nouveaux membres. Tant qu'elle n'est pas acceptée, l'invitation reste en attente.
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} en attente
          </span>
          <button
            onClick={() => setInviteOpen(true)}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
            <UserPlus className="w-4 h-4" />
            Nouvelle invitation
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
              <th className="px-4 py-2">Invité</th>
              <th className="px-4 py-2">Droits prévus</th>
              <th className="px-4 py-2">Envoyée</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map(inv => (
              <tr key={inv.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-none">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {inv.firstName} {inv.lastName}
                      </div>
                      <div className="text-xs text-gray-400">{inv.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                      Membre
                    </span>
                    {inv.role === 'coach' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                        Coach
                      </span>
                    )}
                    {inv.role === 'admin' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                        Admin
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {timeAgo(inv.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => resendMutation.mutate(inv.id)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 transition-colors">
                      Relancer
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(inv.id)}
                      className="p-1 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inviteOpen && (
        <InviteMemberModal
          onClose={() => setInviteOpen(false)}
          onInvite={d => inviteMutation.mutate(d)}
        />
      )}
    </div>
  )
}
