import type { Request, Response } from 'express'
import * as notificationsService from './notifications.service.js'

export async function getPreferences(req: Request, res: Response) {
  const prefs = await notificationsService.getPreferences(req.user!.userId)
  res.json(prefs)
}

export async function updatePreferences(req: Request, res: Response) {
  const prefs = await notificationsService.updatePreferences(req.user!.userId, req.body)
  res.json(prefs)
}
