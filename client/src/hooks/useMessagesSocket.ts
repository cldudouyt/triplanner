import { useEffect, useRef, useCallback } from 'react'
import { getAccessToken } from '@/api/client'

export interface WsMessage {
  threadId: number
  id: number
  senderId: number
  content: string
  createdAt: string
  senderName: string
}

type MessageHandler = (msg: WsMessage) => void

export function useMessagesSocket(onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
    const wsBase = apiBase.replace(/^http/, 'ws')
    const wsUrl = `${wsBase}/ws/messages?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as { event: string; data: unknown }
        if (parsed.event === 'new_message') {
          onMessageRef.current(parsed.data as WsMessage)
        }
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => {
      // Silently fail — component falls back to REST polling
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, []) // Only connect once on mount

  const sendMessage = useCallback((threadId: number, content: string): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'send_message', data: { threadId, content } }))
      return true
    }
    return false // Fallback to REST
  }, [])

  const markRead = useCallback((threadId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'mark_read', data: { threadId } }))
    }
  }, [])

  return { sendMessage, markRead }
}
