import { Request, Response } from 'express'
import * as statisticsService from './statistics.service.js'

export async function getWeeklyStats(req: Request, res: Response) {
  const weeks = parseInt(req.query.weeks as string) || 12
  const stats = await statisticsService.getWeeklyStats(req.user!.userId, weeks)
  res.json(stats)
}

export async function getSportDistribution(req: Request, res: Response) {
  const days = parseInt(req.query.days as string) || 90
  const distribution = await statisticsService.getSportDistribution(req.user!.userId, days)
  res.json(distribution)
}

export async function getOverallStats(req: Request, res: Response) {
  const stats = await statisticsService.getOverallStats(req.user!.userId)
  res.json(stats)
}

export async function getUpcomingSessions(req: Request, res: Response) {
  const days = parseInt(req.query.days as string) || 7
  const sessions = await statisticsService.getUpcomingSessions(req.user!.userId, days)
  res.json(sessions)
}

export async function getRecentActivity(req: Request, res: Response) {
  const limit = parseInt(req.query.limit as string) || 10
  const activity = await statisticsService.getRecentActivity(req.user!.userId, limit)
  res.json(activity)
}

export async function getTrainingLoad(req: Request, res: Response) {
  const days = parseInt(req.query.days as string) || 90
  const load = await statisticsService.getTrainingLoad(req.user!.userId, days)
  res.json(load)
}

export async function getDashboard(req: Request, res: Response) {
  const [overall, weekly, distribution, upcoming, recent] = await Promise.all([
    statisticsService.getOverallStats(req.user!.userId),
    statisticsService.getWeeklyStats(req.user!.userId, 4),
    statisticsService.getSportDistribution(req.user!.userId, 30),
    statisticsService.getUpcomingSessions(req.user!.userId, 7),
    statisticsService.getRecentActivity(req.user!.userId, 5),
  ])

  res.json({
    overall,
    weekly,
    distribution,
    upcoming,
    recent,
  })
}
