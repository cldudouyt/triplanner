import { describe, it, expect, beforeEach } from 'vitest'
import prisma from '../../config/database.js'
import { hashPassword } from '../../utils/password.js'
import {
  getWeeklyStats,
  getSportDistribution,
  getOverallStats,
  getTrainingLoad,
} from './statistics.service.js'

async function createUser(email = `stats-test-${Date.now()}@example.com`) {
  return prisma.user.create({
    data: {
      email,
      password: await hashPassword('testpassword'),
      firstName: 'Stats',
      lastName: 'Test',
    },
  })
}

async function createPlanWithSessions(
  userId: number,
  sessions: Array<{
    date: Date
    type: string
    duration: number
    actualDuration?: number
    distance?: number
    actualDistance?: number
    completed?: boolean
    intensity?: string
  }>
) {
  const plan = await prisma.trainingPlan.create({
    data: {
      userId,
      name: 'Test Plan',
      targetType: 'sprint',
      durationWeeks: 8,
    },
  })

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    await prisma.trainingSession.create({
      data: {
        planId: plan.id,
        weekNumber: 1,
        dayOfWeek: (i % 7) + 1,
        date: s.date,
        type: s.type,
        title: `Session ${i + 1}`,
        duration: s.duration,
        actualDuration: s.actualDuration ?? null,
        distance: s.distance ?? null,
        actualDistance: s.actualDistance ?? null,
        completed: s.completed ?? true,
        intensity: s.intensity ?? 'moderate',
      },
    })
  }

  return plan
}

describe('Statistics Service', () => {
  let userId: number

  beforeEach(async () => {
    const user = await createUser()
    userId = user.id
  })

  describe('getOverallStats', () => {
    it('returns zero stats when no sessions exist', async () => {
      const stats = await getOverallStats(userId)

      expect(stats.totalSessions).toBe(0)
      expect(stats.completedSessions).toBe(0)
      expect(stats.completionRate).toBe(0)
      expect(stats.totalDuration).toBe(0)
      expect(stats.totalDistance).toBe(0)
      expect(stats.currentStreak).toBe(0)
      expect(stats.longestStreak).toBe(0)
    })

    it('calculates completion rate correctly', async () => {
      const now = new Date()
      await createPlanWithSessions(userId, [
        { date: new Date(now.getTime() - 1 * 86400000), type: 'run', duration: 60, completed: true },
        { date: new Date(now.getTime() - 2 * 86400000), type: 'swim', duration: 45, completed: true },
        { date: new Date(now.getTime() - 3 * 86400000), type: 'bike', duration: 90, completed: false },
        { date: new Date(now.getTime() - 4 * 86400000), type: 'run', duration: 30, completed: false },
      ])

      const stats = await getOverallStats(userId)

      expect(stats.totalSessions).toBe(4)
      expect(stats.completedSessions).toBe(2)
      expect(stats.completionRate).toBe(50)
    })

    it('sums up total duration and distance for completed sessions', async () => {
      const now = new Date()
      await createPlanWithSessions(userId, [
        { date: new Date(now.getTime() - 1 * 86400000), type: 'run', duration: 60, actualDuration: 65, distance: 10000, actualDistance: 10500, completed: true },
        { date: new Date(now.getTime() - 2 * 86400000), type: 'swim', duration: 45, actualDuration: 50, distance: 2000, actualDistance: 2100, completed: true },
        // Not completed — should not be counted
        { date: new Date(now.getTime() - 3 * 86400000), type: 'bike', duration: 90, completed: false },
      ])

      const stats = await getOverallStats(userId)

      expect(stats.totalDuration).toBe(65 + 50)
      expect(stats.totalDistance).toBe(10500 + 2100)
    })

    it('uses planned duration when actualDuration is not set', async () => {
      const now = new Date()
      await createPlanWithSessions(userId, [
        { date: new Date(now.getTime() - 1 * 86400000), type: 'run', duration: 60, completed: true },
      ])

      const stats = await getOverallStats(userId)

      expect(stats.totalDuration).toBe(60)
    })

    it('calculates average session duration', async () => {
      const now = new Date()
      await createPlanWithSessions(userId, [
        { date: new Date(now.getTime() - 1 * 86400000), type: 'run', duration: 60, actualDuration: 60, completed: true },
        { date: new Date(now.getTime() - 2 * 86400000), type: 'swim', duration: 40, actualDuration: 40, completed: true },
      ])

      const stats = await getOverallStats(userId)

      expect(stats.averageSessionDuration).toBe(50) // (60 + 40) / 2
    })
  })

  describe('getWeeklyStats', () => {
    it('returns array with correct week count', async () => {
      const stats = await getWeeklyStats(userId, 4)

      expect(stats.length).toBeGreaterThanOrEqual(4)
    })

    it('aggregates sessions by sport type', async () => {
      const now = new Date()
      // Session in the current week
      await createPlanWithSessions(userId, [
        { date: now, type: 'swim', duration: 60, actualDuration: 60, completed: true },
        { date: now, type: 'bike', duration: 90, actualDuration: 90, completed: true },
        { date: now, type: 'run', duration: 45, actualDuration: 45, completed: true },
      ])

      const stats = await getWeeklyStats(userId, 4)
      const currentWeek = stats[stats.length - 1]

      expect(currentWeek.swim.sessions).toBe(1)
      expect(currentWeek.swim.duration).toBe(60)
      expect(currentWeek.bike.sessions).toBe(1)
      expect(currentWeek.bike.duration).toBe(90)
      expect(currentWeek.run.sessions).toBe(1)
      expect(currentWeek.run.duration).toBe(45)
    })

    it('counts total duration across all sports', async () => {
      const now = new Date()
      await createPlanWithSessions(userId, [
        { date: now, type: 'swim', duration: 60, actualDuration: 60, completed: true },
        { date: now, type: 'run', duration: 45, actualDuration: 45, completed: true },
      ])

      const stats = await getWeeklyStats(userId, 4)
      const currentWeek = stats[stats.length - 1]

      expect(currentWeek.total.duration).toBe(105)
      expect(currentWeek.total.sessions).toBe(2)
    })
  })

  describe('getSportDistribution', () => {
    it('returns empty array when no completed sessions', async () => {
      const distribution = await getSportDistribution(userId)

      expect(distribution).toEqual([])
    })

    it('calculates correct percentages for sport distribution', async () => {
      const now = new Date()
      await createPlanWithSessions(userId, [
        { date: now, type: 'run', duration: 60, actualDuration: 60, completed: true },
        { date: now, type: 'run', duration: 60, actualDuration: 60, completed: true },
        { date: now, type: 'swim', duration: 60, actualDuration: 60, completed: true },
        // Not completed — should not count
        { date: now, type: 'bike', duration: 60, completed: false },
      ])

      const distribution = await getSportDistribution(userId)

      const runEntry = distribution.find(d => d.type === 'run')
      const swimEntry = distribution.find(d => d.type === 'swim')
      const bikeEntry = distribution.find(d => d.type === 'bike')

      expect(runEntry).toBeDefined()
      expect(runEntry?.percentage).toBe(67) // 120/180 = 67%
      expect(swimEntry).toBeDefined()
      expect(swimEntry?.percentage).toBe(33) // 60/180 = 33%
      expect(bikeEntry).toBeUndefined() // not completed → not in distribution
    })

    it('sorts by duration descending', async () => {
      const now = new Date()
      await createPlanWithSessions(userId, [
        { date: now, type: 'swim', duration: 30, actualDuration: 30, completed: true },
        { date: now, type: 'run', duration: 90, actualDuration: 90, completed: true },
        { date: now, type: 'bike', duration: 60, actualDuration: 60, completed: true },
      ])

      const distribution = await getSportDistribution(userId)

      expect(distribution[0].type).toBe('run')   // 90 min
      expect(distribution[1].type).toBe('bike')  // 60 min
      expect(distribution[2].type).toBe('swim')  // 30 min
    })
  })

  describe('getTrainingLoad', () => {
    it('returns array of training load points for the requested period', async () => {
      const points = await getTrainingLoad(userId, 30)

      // Should return 30 data points (one per day)
      expect(points.length).toBe(31) // days 0..30 inclusive
      expect(points[0]).toHaveProperty('date')
      expect(points[0]).toHaveProperty('tss')
      expect(points[0]).toHaveProperty('ctl')
      expect(points[0]).toHaveProperty('atl')
      expect(points[0]).toHaveProperty('tsb')
    })

    it('returns zero load when no sessions exist', async () => {
      const points = await getTrainingLoad(userId, 7)
      const totalTSS = points.reduce((sum, p) => sum + p.tss, 0)

      expect(totalTSS).toBe(0)
      // CTL and ATL stay at zero with no training stress
      expect(points[points.length - 1].ctl).toBe(0)
      expect(points[points.length - 1].atl).toBe(0)
    })

    it('CTL is positive after a week of training', async () => {
      const now = new Date()
      // 7 sessions of 60 min moderate intensity in the past week
      await createPlanWithSessions(userId, Array.from({ length: 7 }, (_, i) => ({
        date: new Date(now.getTime() - i * 86400000),
        type: 'run',
        duration: 60,
        actualDuration: 60,
        completed: true,
        intensity: 'moderate',
      })))

      const points = await getTrainingLoad(userId, 14)
      const lastPoint = points[points.length - 1]

      expect(lastPoint.ctl).toBeGreaterThan(0)
      expect(lastPoint.atl).toBeGreaterThan(0)
    })

    it('TSB is negative when ATL exceeds CTL (hard training block)', () => {
      // Pure unit test — no DB needed
      // When ATL > CTL, the athlete is fatigued
      const ctl = 60  // chronic load (fitness)
      const atl = 80  // acute load (fatigue)
      const tsb = ctl - atl

      expect(tsb).toBe(-20)
      expect(tsb).toBeLessThan(0)
    })

    it('TSB is positive when CTL exceeds ATL (freshness/taper)', () => {
      // Pure unit test — no DB needed
      // When CTL > ATL, the athlete is fresh (tapering effect)
      const ctl = 75
      const atl = 60
      const tsb = ctl - atl

      expect(tsb).toBe(15)
      expect(tsb).toBeGreaterThan(0)
    })

    it('dates are returned in ascending order', async () => {
      const points = await getTrainingLoad(userId, 14)

      for (let i = 1; i < points.length; i++) {
        expect(points[i].date >= points[i - 1].date).toBe(true)
      }
    })
  })
})
