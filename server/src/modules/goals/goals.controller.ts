import type { Request, Response } from 'express'
import * as goalsService from './goals.service.js'

export async function listGoals(req: Request, res: Response) {
  const year = req.query.year ? Number(req.query.year) : undefined
  const goals = await goalsService.getGoalsWithProgress(req.user!.userId, year)
  res.json(goals)
}

export async function createGoal(req: Request, res: Response) {
  const goal = await goalsService.createGoal(req.user!.userId, req.body)
  res.status(201).json(goal)
}

export async function deleteGoal(req: Request, res: Response) {
  await goalsService.deleteGoal(req.user!.userId, Number(req.params.id))
  res.status(204).end()
}
