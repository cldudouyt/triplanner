import { Request, Response } from 'express'
import * as achievementsService from './achievements.service.js'

export async function getAchievements(req: Request, res: Response) {
  const achievements = await achievementsService.getUserAchievements(req.user!.userId)
  res.json(achievements)
}

export async function checkAchievements(req: Request, res: Response) {
  const result = await achievementsService.checkAndUnlockAchievements(req.user!.userId)
  res.json(result)
}

export async function getDefinitions(_req: Request, res: Response) {
  res.json(achievementsService.ACHIEVEMENTS)
}
