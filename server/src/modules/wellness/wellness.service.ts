import prisma from '../../config/database.js'
import type { CreateWellnessLogInput } from './wellness.schema.js'

function calculateReadinessScore(data: CreateWellnessLogInput): number {
  const sleepScore = (data.sleepQuality / 5) * 100
  const fatigueScore = ((6 - data.fatigue) / 5) * 100
  const moodScore = (data.mood / 5) * 100
  const sorenessScore = ((6 - data.muscleSoreness) / 5) * 100
  const stressScore = ((6 - data.stress) / 5) * 100

  let score = sleepScore * 0.3 + fatigueScore * 0.25 + moodScore * 0.15 + sorenessScore * 0.2 + stressScore * 0.1

  if (data.sleepHours) {
    if (data.sleepHours >= 7 && data.sleepHours <= 9) {
      score = Math.min(100, score + 5)
    } else if (data.sleepHours < 6) {
      score = Math.max(0, score - 10)
    }
  }

  if (data.hrv && data.hrv > 60) {
    score = Math.min(100, score + 5)
  }

  return Math.round(score)
}

export async function createLog(userId: number, data: CreateWellnessLogInput) {
  const readinessScore = calculateReadinessScore(data)

  const date = new Date(data.date)
  date.setHours(0, 0, 0, 0)

  return prisma.wellnessLog.upsert({
    where: { userId_date: { userId, date } },
    update: {
      ...data,
      date,
      readinessScore,
    },
    create: {
      userId,
      ...data,
      date,
      readinessScore,
    },
  })
}

export async function getLogs(userId: number, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return prisma.wellnessLog.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'desc' },
  })
}

export async function getToday(userId: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return prisma.wellnessLog.findFirst({
    where: {
      userId,
      date: { gte: today, lt: tomorrow },
    },
  })
}

export async function getReadinessTrend(userId: number, days: number = 14) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const logs = await prisma.wellnessLog.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      readinessScore: true,
      sleepQuality: true,
      fatigue: true,
      mood: true,
      muscleSoreness: true,
      stress: true,
      sleepHours: true,
    },
  })

  const avgReadiness = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + l.readinessScore, 0) / logs.length)
    : 0

  return {
    logs,
    averageReadiness: avgReadiness,
    totalEntries: logs.length,
  }
}

export interface WellnessAlert {
  type: 'low_readiness_streak' | 'very_low_readiness'
  message: string
  severity: 'warning' | 'danger'
  days: number
}

export async function getTrendAlerts(userId: number): Promise<WellnessAlert[]> {
  // Look at last 7 days to detect 3 consecutive low readiness days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  const logs = await prisma.wellnessLog.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'desc' },
    select: {
      date: true,
      readinessScore: true,
    },
  })

  const alerts: WellnessAlert[] = []

  if (logs.length === 0) return alerts

  // Count consecutive days with readiness < 50
  let consecutiveLowDays = 0
  for (const log of logs) {
    if (log.readinessScore < 50) {
      consecutiveLowDays++
    } else {
      break
    }
  }

  if (consecutiveLowDays >= 3) {
    alerts.push({
      type: 'low_readiness_streak',
      message: `Votre niveau de forme est faible depuis ${consecutiveLowDays} jours consécutifs. Privilégiez la récupération et réduisez l'intensité.`,
      severity: consecutiveLowDays >= 5 ? 'danger' : 'warning',
      days: consecutiveLowDays,
    })
  }

  // Alert if today's score is very low (< 30)
  const todayLog = logs[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const logDate = new Date(todayLog.date)
  logDate.setHours(0, 0, 0, 0)

  if (logDate.getTime() === today.getTime() && todayLog.readinessScore < 30) {
    alerts.push({
      type: 'very_low_readiness',
      message: `Score de forme très bas aujourd'hui (${todayLog.readinessScore}/100). Repos complet recommandé.`,
      severity: 'danger',
      days: 1,
    })
  }

  return alerts
}

export async function deleteLog(userId: number, id: number) {
  return prisma.wellnessLog.deleteMany({
    where: { id, userId },
  })
}
