import { Request, Response } from 'express'
import * as messagesService from './messages.service.js'

export async function getThreads(req: Request, res: Response) {
  const threads = await messagesService.getThreads(req.user!.userId)
  res.json(threads)
}

export async function getUnreadCount(req: Request, res: Response) {
  const result = await messagesService.getUnreadCount(req.user!.userId)
  res.json(result)
}

export async function createThread(req: Request, res: Response) {
  const { recipientId, content } = req.body as { recipientId: number; content: string }
  const result = await messagesService.createThread(req.user!.userId, recipientId, content)
  res.status(201).json(result)
}

export async function getMessages(req: Request, res: Response) {
  const threadId = parseInt(req.params.threadId as string)
  if (isNaN(threadId)) {
    res.status(400).json({ error: 'threadId invalide' })
    return
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
  const result = await messagesService.getMessages(threadId, req.user!.userId, limit)
  if (!result) {
    res.status(404).json({ error: 'Fil de discussion non trouvé ou accès non autorisé' })
    return
  }
  res.json(result)
}

export async function sendMessage(req: Request, res: Response) {
  const threadId = parseInt(req.params.threadId as string)
  if (isNaN(threadId)) {
    res.status(400).json({ error: 'threadId invalide' })
    return
  }

  const { content } = req.body as { content: string }
  const result = await messagesService.sendMessage(threadId, req.user!.userId, content)
  if (!result) {
    res.status(404).json({ error: 'Fil de discussion non trouvé ou accès non autorisé' })
    return
  }
  res.status(201).json(result)
}

export async function markAsRead(req: Request, res: Response) {
  const threadId = parseInt(req.params.threadId as string)
  if (isNaN(threadId)) {
    res.status(400).json({ error: 'threadId invalide' })
    return
  }

  const success = await messagesService.markAsRead(threadId, req.user!.userId)
  if (!success) {
    res.status(404).json({ error: 'Fil de discussion non trouvé ou accès non autorisé' })
    return
  }
  res.json({ success: true })
}
