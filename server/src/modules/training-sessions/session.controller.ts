import { Request, Response } from 'express'
import * as sessionService from './session.service.js'

export async function findById(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const session = await sessionService.findById(req.user!.userId, id)
  if (!session) {
    res.status(404).json({ error: 'Séance non trouvée' })
    return
  }
  res.json(session)
}

export async function create(req: Request, res: Response) {
  const session = await sessionService.create(req.user!.userId, req.body)
  if (!session) {
    res.status(404).json({ error: 'Plan non trouvé' })
    return
  }
  res.status(201).json(session)
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const session = await sessionService.update(req.user!.userId, id, req.body)
  if (!session) {
    res.status(404).json({ error: 'Séance non trouvée' })
    return
  }
  res.json(session)
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const success = await sessionService.remove(req.user!.userId, id)
  if (!success) {
    res.status(404).json({ error: 'Séance non trouvée' })
    return
  }
  res.status(204).send()
}
