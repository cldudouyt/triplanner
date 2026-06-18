import { Request, Response } from 'express'
import * as wellnessService from './wellness.service.js'

export async function createLog(req: Request, res: Response) {
  const log = await wellnessService.createLog(req.user!.userId, req.body)
  res.status(201).json(log)
}

export async function getLogs(req: Request, res: Response) {
  const days = parseInt(req.query.days as string) || 30
  const logs = await wellnessService.getLogs(req.user!.userId, days)
  res.json(logs)
}

export async function getToday(req: Request, res: Response) {
  const log = await wellnessService.getToday(req.user!.userId)
  res.json(log)
}

export async function getTrend(req: Request, res: Response) {
  const days = parseInt(req.query.days as string) || 14
  const trend = await wellnessService.getReadinessTrend(req.user!.userId, days)
  res.json(trend)
}

export async function getAlerts(req: Request, res: Response) {
  const alerts = await wellnessService.getTrendAlerts(req.user!.userId)
  res.json(alerts)
}

export async function deleteLog(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  await wellnessService.deleteLog(req.user!.userId, id)
  res.status(204).send()
}
