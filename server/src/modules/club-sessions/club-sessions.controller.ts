import type { Request, Response } from 'express'
import * as service from './club-sessions.service.js'
import { createSessionSchema } from './club-sessions.schema.js'

export async function list(req: Request, res: Response) {
  const sessions = await service.listSessions(req.user!.userId, req.query.sport as string | undefined)
  res.json(sessions)
}

export async function create(req: Request, res: Response) {
  const data = createSessionSchema.parse(req.body)
  const session = await service.createSession(req.user!.userId, data)
  res.status(201).json(session)
}

export async function register(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const reg = await service.registerForSession(id, req.user!.userId)
  res.status(201).json(reg)
}

export async function unregister(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  await service.unregisterFromSession(id, req.user!.userId)
  res.status(204).send()
}

export async function attendees(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const attendeeList = await service.getSessionAttendees(id, req.user!.userId)
  if (!attendeeList) return res.status(404).json({ error: 'Not found' })
  res.json(attendeeList)
}
