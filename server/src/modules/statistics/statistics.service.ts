import prisma from '../../config/database.js'

interface WeeklyStats {
  week: string
  weekStart: string
  weekEnd: string
  swim: { duration: number; distance: number; sessions: number }
  bike: { duration: number; distance: number; sessions: number }
  run: { duration: number; distance: number; sessions: number }
  other: { duration: number; distance: number; sessions: number }
  total: { duration: number; distance: number; sessions: number; completed: number }
}

interface SportDistribution {
  type: string
  duration: number
  distance: number
  sessions: number
  percentage: number
}

interface OverallStats {
  totalSessions: number
  completedSessions: number
  completionRate: number
  totalDuration: number
  totalDistance: number
  averageSessionDuration: number
  currentStreak: number
  longestStreak: number
}

function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getWeekRange(weekStart: string): { start: Date; end: Date } {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start, end }
}

export async function getWeeklyStats(userId: number, weeks: number = 12): Promise<WeeklyStats[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (weeks * 7))

  // Get all sessions for user's plans in the date range
  const sessions = await prisma.trainingSession.findMany({
    where: {
      plan: { userId },
      date: { gte: startDate },
    },
    select: {
      date: true,
      type: true,
      duration: true,
      distance: true,
      actualDuration: true,
      actualDistance: true,
      completed: true,
    },
  })

  // Group by week
  const weekMap = new Map<string, WeeklyStats>()

  // Initialize all weeks
  for (let i = 0; i < weeks; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (i * 7))
    const weekKey = getWeekKey(d)
    const { start, end } = getWeekRange(weekKey)

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        week: weekKey,
        weekStart: start.toISOString().split('T')[0],
        weekEnd: end.toISOString().split('T')[0],
        swim: { duration: 0, distance: 0, sessions: 0 },
        bike: { duration: 0, distance: 0, sessions: 0 },
        run: { duration: 0, distance: 0, sessions: 0 },
        other: { duration: 0, distance: 0, sessions: 0 },
        total: { duration: 0, distance: 0, sessions: 0, completed: 0 },
      })
    }
  }

  // Aggregate sessions
  for (const session of sessions) {
    if (!session.date) continue

    const weekKey = getWeekKey(session.date)
    let stats = weekMap.get(weekKey)

    if (!stats) {
      const { start, end } = getWeekRange(weekKey)
      stats = {
        week: weekKey,
        weekStart: start.toISOString().split('T')[0],
        weekEnd: end.toISOString().split('T')[0],
        swim: { duration: 0, distance: 0, sessions: 0 },
        bike: { duration: 0, distance: 0, sessions: 0 },
        run: { duration: 0, distance: 0, sessions: 0 },
        other: { duration: 0, distance: 0, sessions: 0 },
        total: { duration: 0, distance: 0, sessions: 0, completed: 0 },
      }
      weekMap.set(weekKey, stats)
    }

    const duration = session.completed ? (session.actualDuration || session.duration || 0) : (session.duration || 0)
    const distance = session.completed ? (session.actualDistance || session.distance || 0) : (session.distance || 0)

    const sportKey = ['swim', 'bike', 'run'].includes(session.type) ? session.type as 'swim' | 'bike' | 'run' : 'other'
    stats[sportKey].duration += duration
    stats[sportKey].distance += distance
    stats[sportKey].sessions += 1

    stats.total.duration += duration
    stats.total.distance += distance
    stats.total.sessions += 1
    if (session.completed) stats.total.completed += 1
  }

  // Sort by week and return
  return Array.from(weekMap.values()).sort((a, b) => a.week.localeCompare(b.week))
}

export async function getSportDistribution(userId: number, days: number = 90): Promise<SportDistribution[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const sessions = await prisma.trainingSession.findMany({
    where: {
      plan: { userId },
      date: { gte: startDate },
      completed: true,
    },
    select: {
      type: true,
      actualDuration: true,
      duration: true,
      actualDistance: true,
      distance: true,
    },
  })

  const sportMap = new Map<string, { duration: number; distance: number; sessions: number }>()
  let totalDuration = 0

  for (const session of sessions) {
    const type = session.type
    const duration = session.actualDuration || session.duration || 0
    const distance = session.actualDistance || session.distance || 0

    if (!sportMap.has(type)) {
      sportMap.set(type, { duration: 0, distance: 0, sessions: 0 })
    }

    const stats = sportMap.get(type)!
    stats.duration += duration
    stats.distance += distance
    stats.sessions += 1
    totalDuration += duration
  }

  return Array.from(sportMap.entries())
    .map(([type, stats]) => ({
      type,
      ...stats,
      percentage: totalDuration > 0 ? Math.round((stats.duration / totalDuration) * 100) : 0,
    }))
    .sort((a, b) => b.duration - a.duration)
}

export async function getOverallStats(userId: number): Promise<OverallStats> {
  const sessions = await prisma.trainingSession.findMany({
    where: {
      plan: { userId },
    },
    select: {
      date: true,
      completed: true,
      duration: true,
      distance: true,
      actualDuration: true,
      actualDistance: true,
    },
    orderBy: { date: 'desc' },
  })

  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.completed).length
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  let totalDuration = 0
  let totalDistance = 0

  for (const session of sessions) {
    if (session.completed) {
      totalDuration += session.actualDuration || session.duration || 0
      totalDistance += session.actualDistance || session.distance || 0
    }
  }

  const averageSessionDuration = completedSessions > 0 ? Math.round(totalDuration / completedSessions) : 0

  // Calculate streaks
  let currentStreak = 0
  let longestStreak = 0
  let streak = 0
  let lastDate: Date | null = null

  const completedDates = sessions
    .filter(s => s.completed && s.date)
    .map(s => s.date!)
    .sort((a, b) => b.getTime() - a.getTime())

  for (const date of completedDates) {
    if (!lastDate) {
      streak = 1
      lastDate = date
      continue
    }

    const diffDays = Math.floor((lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 2) { // Allow 1 day gap
      streak++
    } else {
      if (currentStreak === 0) currentStreak = streak
      longestStreak = Math.max(longestStreak, streak)
      streak = 1
    }
    lastDate = date
  }

  if (currentStreak === 0) currentStreak = streak
  longestStreak = Math.max(longestStreak, streak)

  return {
    totalSessions,
    completedSessions,
    completionRate,
    totalDuration,
    totalDistance,
    averageSessionDuration,
    currentStreak,
    longestStreak,
  }
}

export async function getUpcomingSessions(userId: number, days: number = 7) {
  const now = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  return prisma.trainingSession.findMany({
    where: {
      plan: { userId },
      date: {
        gte: now,
        lte: endDate,
      },
      completed: false,
    },
    include: {
      plan: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
    take: 10,
  })
}

export async function getRecentActivity(userId: number, limit: number = 10) {
  return prisma.trainingSession.findMany({
    where: {
      plan: { userId },
      completed: true,
    },
    include: {
      plan: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  })
}

// Training Load model: CTL (Chronic Training Load / Fitness),
// ATL (Acute Training Load / Fatigue), TSB (Training Stress Balance / Form)
interface TrainingLoadPoint {
  date: string
  tss: number   // Training Stress Score for the day
  ctl: number   // Chronic Training Load (42-day exponential avg)
  atl: number   // Acute Training Load (7-day exponential avg)
  tsb: number   // Training Stress Balance (ctl - atl)
}

function estimateTSS(duration: number, intensity: string | null): number {
  // Estimate TSS from duration (minutes) and intensity
  const intensityMultipliers: Record<string, number> = {
    'easy': 0.5,
    'moderate': 0.7,
    'hard': 0.9,
    'interval': 1.1,
    'race-pace': 1.2,
  }
  const multiplier = intensityMultipliers[intensity || 'moderate'] || 0.7
  return Math.round((duration / 60) * multiplier * 100)
}

export async function getTrainingLoad(userId: number, days: number = 90): Promise<TrainingLoadPoint[]> {
  // Fetch sessions from further back for accurate CTL
  const lookbackDays = days + 60
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)

  const sessions = await prisma.trainingSession.findMany({
    where: {
      plan: { userId },
      date: { gte: startDate },
      completed: true,
    },
    select: {
      date: true,
      duration: true,
      actualDuration: true,
      intensity: true,
    },
    orderBy: { date: 'asc' },
  })

  // Build daily TSS map
  const dailyTSS = new Map<string, number>()
  for (const session of sessions) {
    if (!session.date) continue
    const dateKey = session.date.toISOString().split('T')[0]
    const duration = session.actualDuration || session.duration || 0
    const tss = estimateTSS(duration, session.intensity)
    dailyTSS.set(dateKey, (dailyTSS.get(dateKey) || 0) + tss)
  }

  // Calculate exponential moving averages
  const results: TrainingLoadPoint[] = []
  let ctl = 0
  let atl = 0
  const ctlDecay = 1 - Math.exp(-1 / 42) // 42-day time constant
  const atlDecay = 1 - Math.exp(-1 / 7)   // 7-day time constant

  const outputStartDate = new Date()
  outputStartDate.setDate(outputStartDate.getDate() - days)

  for (let i = lookbackDays; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateKey = d.toISOString().split('T')[0]
    const tss = dailyTSS.get(dateKey) || 0

    ctl = ctl + ctlDecay * (tss - ctl)
    atl = atl + atlDecay * (tss - atl)
    const tsb = Math.round(ctl - atl)

    if (d >= outputStartDate) {
      results.push({
        date: dateKey,
        tss,
        ctl: Math.round(ctl),
        atl: Math.round(atl),
        tsb,
      })
    }
  }

  return results
}
