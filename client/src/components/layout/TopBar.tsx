import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Plus, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { messagesApi } from '@/api/messages.api'
import NotificationsPanel from './NotificationsPanel'
import NewSessionModal from '@/components/modals/NewSessionModal'

export default function TopBar() {
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [newSessionOpen, setNewSessionOpen] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => messagesApi.getUnreadCount().then(r => r.data),
    refetchInterval: 30000,
  })
  const unreadCount = unreadData?.count ?? 0

  return (
    <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 px-6 py-3 flex items-center gap-3">
      <div className="flex-1" />

      <input
        placeholder="Rechercher..."
        className="w-56 px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 outline-none focus:ring-2 focus:ring-orange-300"
      />

      <button
        onClick={() => navigate('/settings')}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Paramètres"
      >
        <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>

      <div className="relative">
        <button
          onClick={() => setNotifOpen(prev => !prev)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
          )}
        </button>
        {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
      </div>

      <button
        onClick={() => setNewSessionOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
      >
        <Plus className="w-4 h-4" />
        Séance
      </button>

      {newSessionOpen && <NewSessionModal onClose={() => setNewSessionOpen(false)} />}
    </div>
  )
}
