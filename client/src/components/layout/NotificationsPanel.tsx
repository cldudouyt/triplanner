import { useEffect, useRef } from 'react'
import { Sparkles, Dumbbell, Activity } from 'lucide-react'

interface Props {
  onClose: () => void
}

type NotifIcon = 'spark' | 'swap' | 'run'

interface MockNotif {
  id: number
  icon: NotifIcon
  text: string
  time: string
  read: boolean
}

const MOCK_NOTIFS: MockNotif[] = [
  { id: 1, icon: 'spark', text: "Ton coach a envoyé un plan optimisé pour la semaine 6.", time: "il y a 2h", read: false },
  { id: 2, icon: 'swap', text: "Julie B. a décalé ton renfo au mardi.", time: "hier", read: true },
  { id: 3, icon: 'run', text: "Séance VMA prévue aujourd'hui à 18h00.", time: "aujourd'hui", read: true },
  { id: 4, icon: 'spark', text: "Nouveau record FTP détecté : 248 W 🎉", time: "3 j", read: true },
]

function NotifIcon({ icon }: { icon: NotifIcon }) {
  if (icon === 'spark') return <Sparkles className="w-4 h-4 text-orange-600" />
  if (icon === 'swap') return <Dumbbell className="w-4 h-4 text-slate-500" />
  return <Activity className="w-4 h-4 text-orange-600" />
}

export default function NotificationsPanel({ onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={containerRef}
      className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-4 z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-900 dark:text-gray-100">Notifications</span>
        <button className="text-sm text-orange-600 hover:text-orange-700">Tout marquer lu</button>
      </div>

      <div className="space-y-3">
        {MOCK_NOTIFS.map(n => (
          <div
            key={n.id}
            className={`flex gap-3 p-2 rounded-xl ${!n.read ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-none">
              <NotifIcon icon={n.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 dark:text-gray-200">{n.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
