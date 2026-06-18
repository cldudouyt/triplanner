import { useState, useRef, useEffect } from 'react'
import { X, Bot, Send } from 'lucide-react'
import { getAccessToken } from '@/api/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CoachChatProps {
  onClose: () => void
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: 'Bonjour ! Je suis ton coach IA. Que puis-je faire pour toi ?',
}

export default function CoachChat({ onClose }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [currentChunk, setCurrentChunk] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentChunk])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || streaming) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const history = messages.map(({ role, content }) => ({ role, content }))

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setStreaming(true)
    setCurrentChunk('')

    try {
      const token = getAccessToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: trimmed, history }),
        credentials: 'include',
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data) as { text?: string }
              if (parsed.text) {
                accumulated += parsed.text
                setCurrentChunk(accumulated)
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      // Finalize: move accumulated chunk to messages
      if (accumulated) {
        setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Désolé, une erreur s'est produite. Réessaie dans un instant." },
      ])
    } finally {
      setCurrentChunk('')
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="fixed bottom-24 right-6 w-80 max-h-[600px] z-40 flex flex-col rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl animate-scale-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30">
          <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <span className="flex-1 font-semibold text-gray-900 dark:text-gray-100 text-sm">Coach IA</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={
                msg.role === 'user'
                  ? 'max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-violet-600 text-white text-sm'
                  : 'max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm'
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming indicator or partial response */}
        {streaming && !currentChunk && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-slate-700">
              <span className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        {/* Partial streaming response */}
        {streaming && currentChunk && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm">
              {currentChunk}
              <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-gray-500 dark:bg-gray-400 animate-pulse align-middle" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            placeholder="Pose ta question…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 max-h-28 overflow-y-auto"
            style={{ minHeight: '2.25rem' }}
          />
          <button
            onClick={() => void sendMessage()}
            disabled={streaming || !input.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            aria-label="Envoyer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
