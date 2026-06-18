import { Request, Response } from 'express'
import prisma from '../../config/database.js'

const TYPE_COLORS: Record<string, string> = {
  competition: '#dc2626',
  swim: '#2563eb',
  bike: '#6b7280',
  run: '#16a34a',
  strength: '#9333ea',
  rest: '#d1d5db',
  brick: '#ea580c',
}

const PRIORITY_COLORS: Record<string, string> = {
  A: '#dc2626',
  B: '#f59e0b',
  C: '#22c55e',
}

export async function getEvents(req: Request, res: Response) {
  const { start, end } = req.query
  if (!start || !end) {
    res.status(400).json({ error: 'start and end dates are required' })
    return
  }

  const startDate = new Date(start as string)
  const endDate = new Date(end as string)
  const userId = req.user!.userId

  const [competitions, sessions] = await Promise.all([
    prisma.competition.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    }),
    prisma.trainingSession.findMany({
      where: {
        plan: { userId },
        date: { gte: startDate, lte: endDate },
      },
      include: { plan: { select: { name: true } } },
    }),
  ])

  const events = [
    ...competitions.map(c => ({
      id: `comp-${c.id}`,
      title: c.name,
      start: c.date.toISOString(),
      end: c.date.toISOString(),
      type: 'competition',
      subType: c.subType,
      priority: c.priority,
      color: PRIORITY_COLORS[c.priority] || '#dc2626',
      sourceId: c.id,
      sourceType: 'competition' as const,
    })),
    ...sessions.map(s => ({
      id: `session-${s.id}`,
      title: s.title || `${s.type} ${s.duration ? s.duration + 'min' : ''}`.trim(),
      start: s.date?.toISOString(),
      end: s.date?.toISOString(),
      type: s.type,
      intensity: s.intensity,
      completed: s.completed,
      duration: s.duration,
      distance: s.distance,
      description: s.description,
      notes: s.notes,
      color: TYPE_COLORS[s.type] || '#6b7280',
      sourceId: s.id,
      sourceType: 'training_session' as const,
      planName: s.plan.name,
    })),
  ]

  res.json(events)
}
