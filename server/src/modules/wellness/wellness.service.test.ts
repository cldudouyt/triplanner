import { describe, it, expect, beforeEach } from 'vitest'
import prisma from '../../config/database.js'
import { hashPassword } from '../../utils/password.js'
import {
  createLog,
  getLogs,
  getToday,
  getReadinessTrend,
  getTrendAlerts,
} from './wellness.service.js'

async function createUser(email = `wellness-test-${Date.now()}@example.com`) {
  return prisma.user.create({
    data: {
      email,
      password: await hashPassword('testpassword'),
      firstName: 'Wellness',
      lastName: 'Test',
    },
  })
}

function makeWellnessInput(overrides?: Partial<{
  date: string
  sleepQuality: number
  sleepHours: number
  fatigue: number
  mood: number
  muscleSoreness: number
  stress: number
  hrv: number | null
  notes: string | null
}>) {
  const dateStr = overrides?.date ?? new Date().toISOString().split('T')[0]
  return {
    date: new Date(dateStr),
    sleepQuality: overrides?.sleepQuality ?? 4,
    sleepHours: overrides?.sleepHours ?? 8,
    fatigue: overrides?.fatigue ?? 2,
    mood: overrides?.mood ?? 4,
    muscleSoreness: overrides?.muscleSoreness ?? 2,
    stress: overrides?.stress ?? 2,
    hrv: overrides?.hrv ?? undefined,
    notes: overrides?.notes ?? undefined,
  }
}

describe('Wellness Service', () => {
  let userId: number

  beforeEach(async () => {
    const user = await createUser()
    userId = user.id
  })

  describe('createLog', () => {
    it('creates a wellness log and computes readiness score', async () => {
      const log = await createLog(userId, makeWellnessInput())

      expect(log).toBeDefined()
      expect(log.userId).toBe(userId)
      expect(log.readinessScore).toBeGreaterThan(0)
      expect(log.readinessScore).toBeLessThanOrEqual(100)
    })

    it('computes high readiness score for good wellness values', async () => {
      // Best case: good sleep, low fatigue, good mood, no soreness, no stress
      const log = await createLog(userId, makeWellnessInput({
        sleepQuality: 5,
        sleepHours: 8,
        fatigue: 1,
        mood: 5,
        muscleSoreness: 1,
        stress: 1,
      }))

      expect(log.readinessScore).toBeGreaterThan(80)
    })

    it('computes low readiness score for poor wellness values', async () => {
      // Worst case: poor sleep, high fatigue, bad mood, heavy soreness, high stress
      const log = await createLog(userId, makeWellnessInput({
        sleepQuality: 1,
        sleepHours: 4,
        fatigue: 5,
        mood: 1,
        muscleSoreness: 5,
        stress: 5,
      }))

      expect(log.readinessScore).toBeLessThan(30)
    })

    it('upserts log for same date', async () => {
      const today = new Date().toISOString().split('T')[0]

      await createLog(userId, makeWellnessInput({ date: today, fatigue: 2 }))
      const updated = await createLog(userId, makeWellnessInput({ date: today, fatigue: 4 }))

      // Should have updated the same record, not created a duplicate
      const logs = await getLogs(userId, 1)
      expect(logs.length).toBe(1)
      expect(updated.fatigue).toBe(4)
    })
  })

  describe('getLogs', () => {
    it('returns empty array when no logs exist', async () => {
      const logs = await getLogs(userId)

      expect(logs).toEqual([])
    })

    it('returns logs within the specified date range', async () => {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const oldDate = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0]

      await createLog(userId, makeWellnessInput({ date: todayStr }))
      await createLog(userId, makeWellnessInput({ date: oldDate }))

      // With 30-day window, old log should NOT appear
      const logs = await getLogs(userId, 30)
      expect(logs.length).toBe(1)
      expect(logs[0].fatigue).toBeDefined()
    })

    it('returns logs ordered by date descending', async () => {
      const now = new Date()
      for (let i = 0; i < 3; i++) {
        const date = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0]
        await createLog(userId, makeWellnessInput({ date }))
      }

      const logs = await getLogs(userId, 7)

      expect(logs.length).toBe(3)
      // First log should be the most recent
      for (let i = 1; i < logs.length; i++) {
        expect(logs[i - 1].date >= logs[i].date).toBe(true)
      }
    })
  })

  describe('getToday', () => {
    it('returns null when no log for today', async () => {
      const log = await getToday(userId)

      expect(log).toBeNull()
    })

    it('returns today\'s log when it exists', async () => {
      const today = new Date().toISOString().split('T')[0]
      await createLog(userId, makeWellnessInput({ date: today, mood: 5 }))

      const log = await getToday(userId)

      expect(log).not.toBeNull()
      expect(log?.mood).toBe(5)
    })
  })

  describe('getReadinessTrend', () => {
    it('returns averageReadiness of zero with no logs', async () => {
      const result = await getReadinessTrend(userId, 14)

      expect(result.totalEntries).toBe(0)
      expect(result.averageReadiness).toBe(0)
      expect(result.logs).toEqual([])
    })

    it('calculates average readiness correctly', async () => {
      const now = new Date()
      // Create logs with known readiness scores
      // High readiness
      await createLog(userId, makeWellnessInput({
        date: new Date(now.getTime() - 1 * 86400000).toISOString().split('T')[0],
        sleepQuality: 5, fatigue: 1, mood: 5, muscleSoreness: 1, stress: 1,
      }))
      // Low readiness
      await createLog(userId, makeWellnessInput({
        date: new Date(now.getTime() - 2 * 86400000).toISOString().split('T')[0],
        sleepQuality: 1, fatigue: 5, mood: 1, muscleSoreness: 5, stress: 5,
      }))

      const result = await getReadinessTrend(userId, 14)

      expect(result.totalEntries).toBe(2)
      expect(result.averageReadiness).toBeGreaterThan(0)
      expect(result.averageReadiness).toBeLessThanOrEqual(100)
    })
  })

  describe('getTrendAlerts', () => {
    it('returns no alerts when no logs exist', async () => {
      const alerts = await getTrendAlerts(userId)

      expect(alerts).toEqual([])
    })

    it('returns no alerts when readiness is good', async () => {
      const now = new Date()
      for (let i = 0; i < 3; i++) {
        const date = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0]
        // Good readiness: sleepQuality=5, fatigue=1, mood=5, soreness=1, stress=1
        await createLog(userId, makeWellnessInput({
          date,
          sleepQuality: 5, fatigue: 1, mood: 5, muscleSoreness: 1, stress: 1,
        }))
      }

      const alerts = await getTrendAlerts(userId)

      expect(alerts.length).toBe(0)
    })

    it('detects very_low_readiness alert when today score is below 30', async () => {
      const today = new Date().toISOString().split('T')[0]

      // Worst possible: sleepQuality=1, fatigue=5, mood=1, muscleSoreness=5, stress=5, sleepHours=4
      // Score formula: sleepScore(20) * 0.3 + fatigueScore(0) * 0.25 + moodScore(0) * 0.15 + sorenessScore(0) * 0.2 + stressScore(0) * 0.1 - 10 = 6 - 10 → capped at 0
      await createLog(userId, makeWellnessInput({
        date: today,
        sleepQuality: 1,
        sleepHours: 4,
        fatigue: 5,
        mood: 1,
        muscleSoreness: 5,
        stress: 5,
      }))

      const alerts = await getTrendAlerts(userId)

      const criticalAlert = alerts.find(a => a.type === 'very_low_readiness')
      expect(criticalAlert).toBeDefined()
      expect(criticalAlert?.severity).toBe('danger')
    })

    it('detects low_readiness_streak when readiness < 50 for 3+ consecutive days', async () => {
      const now = new Date()

      // Create 3 consecutive days with low readiness
      for (let i = 0; i < 3; i++) {
        const date = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0]
        // Score around 40: sleepQuality=2, fatigue=4, mood=2, muscleSoreness=4, stress=4
        await createLog(userId, makeWellnessInput({
          date,
          sleepQuality: 2,
          sleepHours: 5,
          fatigue: 4,
          mood: 2,
          muscleSoreness: 4,
          stress: 4,
        }))
      }

      const alerts = await getTrendAlerts(userId)

      const streakAlert = alerts.find(a => a.type === 'low_readiness_streak')
      expect(streakAlert).toBeDefined()
      expect(streakAlert?.severity).toBe('warning')
      expect(streakAlert?.days).toBeGreaterThanOrEqual(3)
    })

    it('streak alert severity is danger when readiness < 50 for 5+ consecutive days', async () => {
      const now = new Date()

      // Create 5 consecutive days with very low readiness
      for (let i = 0; i < 5; i++) {
        const date = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0]
        await createLog(userId, makeWellnessInput({
          date,
          sleepQuality: 2,
          sleepHours: 5,
          fatigue: 4,
          mood: 2,
          muscleSoreness: 4,
          stress: 4,
        }))
      }

      const alerts = await getTrendAlerts(userId)

      const streakAlert = alerts.find(a => a.type === 'low_readiness_streak')
      expect(streakAlert).toBeDefined()
      expect(streakAlert?.severity).toBe('danger')
      expect(streakAlert?.days).toBe(5)
    })

    it('does not trigger streak alert when readiness breaks the streak', async () => {
      const now = new Date()

      // 2 days low, then 1 day good, then 2 days low — streak is broken
      const dateMap = [
        { daysAgo: 0, low: true },
        { daysAgo: 1, low: true },
        { daysAgo: 2, low: false }, // Good day breaks the streak
        { daysAgo: 3, low: true },
        { daysAgo: 4, low: true },
      ]

      for (const entry of dateMap) {
        const date = new Date(now.getTime() - entry.daysAgo * 86400000).toISOString().split('T')[0]
        const input = entry.low
          ? makeWellnessInput({ date, sleepQuality: 2, fatigue: 4, mood: 2, muscleSoreness: 4, stress: 4 })
          : makeWellnessInput({ date, sleepQuality: 5, fatigue: 1, mood: 5, muscleSoreness: 1, stress: 1 })
        await createLog(userId, input)
      }

      const alerts = await getTrendAlerts(userId)

      const streakAlert = alerts.find(a => a.type === 'low_readiness_streak')
      // Only 2 consecutive low days at the start — should not trigger
      expect(streakAlert).toBeUndefined()
    })
  })
})
