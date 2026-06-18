import prisma from '../../config/database.js'
import type { CreateGoalInput } from './goals.schema.js'

export async function getGoals(userId: number, year?: number) {
  const targetYear = year ?? new Date().getFullYear()
  return prisma.seasonGoal.findMany({
    where: { userId, year: targetYear },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getGoalsWithProgress(userId: number, year?: number) {
  const targetYear = year ?? new Date().getFullYear()
  const goals = await getGoals(userId, targetYear)
  const yearStart = new Date(targetYear, 0, 1)
  const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59)

  return Promise.all(goals.map(async (goal) => {
    const sportFilter = goal.sport === 'all' ? {} : { type: goal.sport }

    let currentValue = 0
    if (goal.type === 'sessions') {
      currentValue = await prisma.trainingSession.count({
        where: { plan: { userId }, completed: true, date: { gte: yearStart, lte: yearEnd }, ...sportFilter },
      })
    } else if (goal.type === 'distance') {
      const agg = await prisma.trainingSession.aggregate({
        where: { plan: { userId }, completed: true, date: { gte: yearStart, lte: yearEnd }, ...sportFilter, distance: { not: null } },
        _sum: { distance: true },
      })
      currentValue = (agg._sum.distance ?? 0) / 1000 // meters → km
    } else if (goal.type === 'duration') {
      const agg = await prisma.trainingSession.aggregate({
        where: { plan: { userId }, completed: true, date: { gte: yearStart, lte: yearEnd }, ...sportFilter },
        _sum: { actualDuration: true, duration: true },
      })
      currentValue = (agg._sum.actualDuration ?? agg._sum.duration ?? 0) / 60 // minutes → hours
    }

    const percentage = Math.min(100, Math.round((currentValue / goal.targetValue) * 100))
    // Projection: based on weeks elapsed
    const weekOfYear = Math.ceil((Date.now() - yearStart.getTime()) / (7 * 24 * 3600 * 1000))
    const projection = weekOfYear > 0 ? Math.round((currentValue / weekOfYear) * 52) : 0

    return { ...goal, currentValue: Math.round(currentValue * 10) / 10, percentage, projection }
  }))
}

export async function createGoal(userId: number, data: CreateGoalInput) {
  return prisma.seasonGoal.create({
    data: { ...data, userId },
  })
}

export async function deleteGoal(userId: number, goalId: number) {
  const goal = await prisma.seasonGoal.findFirst({
    where: { id: goalId, userId },
  })
  if (!goal) {
    throw Object.assign(new Error('Goal not found'), { status: 404 })
  }
  return prisma.seasonGoal.delete({ where: { id: goalId } })
}
