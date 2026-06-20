import { useState, useRef, useEffect } from 'react'
import { Search, Bell, Send, MessageSquare, Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { messagesApi, type MessageThread } from '@/api/messages.api'

// Avatar gradient déterministe basé sur la première lettre du prénom
function getAvatarGradient(name: string): string {
  const palettes = [
    'linear-gradient(135deg,#FB923C,#EA580C)', // orange
    'linear-gradient(135deg,#94A3B8,#64748B)', // slate
    'linear-gradient(135deg,#34D399,#059669)', // teal
    'linear-gradient(135deg,#60A5FA,#3B82F6)', // blue
    'linear-gradient(135deg,#A78BFA,#7C3AED)', // violet
  ]
  return palettes[name.charCodeAt(0) % palettes.length]
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diffH = (Date.now() - d.getTime()) / 3600000
  if (diffH < 1) return 'maintenant'
  if (diffH < 24) return `${Math.floor(diffH)}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [selected, setSelected] = useState<MessageThread | null>(null)
  const [inputMsg, setInputMsg] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: threads } = useQuery({
    queryKey: ['threads'],
    queryFn: () => messagesApi.getThreads().then(r => r.data).catch(() => []),
    refetchInterval: 10000,
  })

  const { data: messages } = useQuery({
    queryKey: ['messages', selected?.id],
    queryFn: () =>
      selected
        ? messagesApi.getMessages(selected.id).then(r => r.data)
        : Promise.resolve([]),
    enabled: !!selected,
    refetchInterval: 5000,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => messagesApi.sendMessage(selected!.id, { content }),
    onSuccess: () => {
      setInputMsg('')
      qc.invalidateQueries({ queryKey: ['messages', selected?.id] })
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })

  const markAsRead = (threadId: number) => {
    messagesApi.markAsRead(threadId).catch(() => {})
  }

  const handleSend = () => {
    if (inputMsg.trim() && selected) sendMutation.mutate(inputMsg.trim())
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Échanges avec ton coach et le club
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              placeholder="Rechercher..."
              aria-label="Rechercher une conversation"
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 focus:outline-none w-44"
            />
          </div>
          <button
            aria-label="Notifications"
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/30"
            style={{ background: 'linear-gradient(135deg, #FB923C, #EA580C)' }}
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Séance</span>
          </button>
        </div>
      </div>

      <div
        className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-5"
        style={{ height: 'calc(100vh - 14rem)', minHeight: '400px' }}
      >
        {/* Panel gauche — liste des threads */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden lg:max-h-full max-h-[280px] sm:max-h-[360px]">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Messages</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads?.map(thread => {
              const other = thread.otherParticipant
              const initials = `${(other.firstName || '?')[0]}${(other.lastName || '')[0]}`.toUpperCase()
              return (
                <button
                  key={thread.id}
                  onClick={() => {
                    setSelected(thread)
                    markAsRead(thread.id)
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-slate-700/50 text-left transition-all hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                    selected?.id === thread.id
                      ? 'bg-orange-50/60 dark:bg-orange-900/10'
                      : ''
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: getAvatarGradient(other.firstName || '?') }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`text-sm truncate ${
                          thread.unreadCount > 0
                            ? 'font-semibold text-gray-900 dark:text-gray-100'
                            : 'font-medium text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {other.firstName} {other.lastName}
                        {other.role && (
                          <span className="font-normal text-gray-400 dark:text-gray-500">
                            {' '}· {other.role}
                          </span>
                        )}
                      </p>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatTime(thread.lastAt)}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 truncate ${
                        thread.unreadCount > 0
                          ? 'text-gray-800 dark:text-gray-200 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {thread.lastMessage || 'Nouvelle conversation'}
                    </p>
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 self-center">
                      {thread.unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
            {!threads?.length && (
              <p className="text-center text-sm text-gray-400 py-8">Aucune conversation</p>
            )}
          </div>
        </div>

        {/* Panel droit — conversation */}
        {selected ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden">
            {/* Header conversation */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
              {(() => {
                const other = selected.otherParticipant
                const initials = `${(other.firstName || '?')[0]}${(other.lastName || '')[0]}`.toUpperCase()
                return (
                  <>
                    <div
                      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: getAvatarGradient(other.firstName || '?') }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {other.firstName} {other.lastName}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {other.role || 'Membre'} · en ligne
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Zone messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages?.map(msg => {
                const isMine = msg.senderId === user?.id
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMine && (() => {
                      const other = selected.otherParticipant
                      const initials = `${(other.firstName || '?')[0]}${(other.lastName || '')[0]}`.toUpperCase()
                      return (
                        <div
                          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold mb-0.5"
                          style={{ background: getAvatarGradient(other.firstName || '?') }}
                        >
                          {initials}
                        </div>
                      )
                    })()}
                    <div className="max-w-[65%]">
                      <div
                        className={`px-4 py-2.5 text-sm leading-relaxed ${
                          isMine
                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-[18px] rounded-br-[4px] shadow-md shadow-orange-500/20'
                            : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-slate-600 shadow-sm rounded-[18px] rounded-bl-[4px]'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p
                        className={`text-[10px] text-gray-400 mt-1 ${
                          isMine ? 'text-right pr-1' : 'pl-1'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5">
                <input
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Écrire un message..."
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputMsg.trim()}
                  aria-label="Envoyer le message"
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white disabled:opacity-40 hover:shadow-md hover:shadow-orange-500/30 transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-gray-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sélectionne une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
