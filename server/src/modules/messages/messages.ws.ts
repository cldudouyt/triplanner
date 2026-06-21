import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { Server } from 'http'
import { verifyAccessToken } from '../../utils/jwt.js'
import * as messagesService from './messages.service.js'
import logger from '../../utils/logger.js'

// Map: userId → Set<WebSocket>
const connections = new Map<number, Set<WebSocket>>()

interface WsWithUserId extends WebSocket {
  __userId?: number
}

function getUserId(ws: WsWithUserId): number | null {
  return ws.__userId ?? null
}

function broadcast(userIds: number[], event: string, data: unknown) {
  const payload = JSON.stringify({ event, data })
  for (const uid of userIds) {
    const sockets = connections.get(uid)
    if (!sockets) continue
    for (const sock of sockets) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(payload)
      }
    }
  }
}

export function broadcastToThread(
  participantIds: number[],
  message: {
    threadId: number
    id: number
    senderId: number
    content: string
    createdAt: Date
    senderName: string
  },
) {
  broadcast(participantIds, 'new_message', message)
}

export function createMessagesWss(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/messages' })

  wss.on('connection', async (ws: WsWithUserId, req: IncomingMessage) => {
    // Extract token from query string: ws://host/ws/messages?token=...
    const url = new URL(req.url ?? '', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(4001, 'Unauthorized')
      return
    }

    let userId: number
    try {
      const payload = verifyAccessToken(token)
      userId = payload.userId
    } catch {
      ws.close(4001, 'Invalid token')
      return
    }

    // Register connection
    ws.__userId = userId
    if (!connections.has(userId)) connections.set(userId, new Set())
    connections.get(userId)!.add(ws)
    logger.info({ userId }, 'WS messages: connected')

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { event: string; data: unknown }

        if (msg.event === 'send_message') {
          const { threadId, content } = msg.data as { threadId: number; content: string }
          if (!threadId || !content?.trim()) return

          const saved = await messagesService.sendMessage(threadId, userId, content.trim())
          if (!saved) return

          // Get thread participants to broadcast
          const thread = await messagesService.getThreadParticipants(threadId)
          if (thread) {
            broadcastToThread(thread.participantIds, {
              threadId,
              id: saved.id,
              senderId: userId,
              content: saved.content,
              createdAt: saved.createdAt,
              senderName: saved.senderName,
            })
          }
        }

        if (msg.event === 'mark_read') {
          const { threadId } = msg.data as { threadId: number }
          if (!threadId) return
          await messagesService.markAsRead(threadId, userId)
        }
      } catch (err) {
        logger.error({ err }, 'WS messages: error processing message')
      }
    })

    ws.on('close', () => {
      const uid = getUserId(ws)
      if (uid !== null) {
        connections.get(uid)?.delete(ws)
        if (connections.get(uid)?.size === 0) connections.delete(uid)
        logger.info({ userId: uid }, 'WS messages: disconnected')
      }
    })

    ws.on('error', (err) => {
      const uid = getUserId(ws)
      logger.error({ err, userId: uid }, 'WS messages: socket error')
    })
  })

  return wss
}
