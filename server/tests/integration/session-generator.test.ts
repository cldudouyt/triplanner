import { describe, it, expect } from 'vitest'
import { generateSessionsForPlan, regenerateSessions } from '../../src/modules/training-plans/session-generator.js'
import { prisma } from '../setup.js'
import { createTestUser } from '../helpers.js'

describe('Session Generator', () => {
  describe('generateSessionsForPlan', () => {
    async function createPlan(userId: number, overrides?: Partial<{
      targetType: string
      durationWeeks: number
      level: string
    }>) {
      return prisma.trainingPlan.create({
        data: {
          userId,
          name: 'Test Plan',
          targetType: overrides?.targetType || 'sprint',
          durationWeeks: overrides?.durationWeeks || 4,
          level: overrides?.level,
          startDate: new Date('2026-03-02'),
        },
      })
    }

    it('should generate sessions for a beginner running plan', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: '10k', durationWeeks: 6, level: 'beginner' })

      const count = await generateSessionsForPlan(plan.id, '10k', 6, new Date('2026-03-02'), 'beginner')

      expect(count).toBeGreaterThan(0)

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
        orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
      })

      expect(sessions.length).toBe(count)
      // Beginner running has 3 sessions per week
      expect(sessions.length).toBe(3 * 6)

      // Check session types
      const types = sessions.map(s => s.type)
      expect(types).toContain('run')
      expect(types).toContain('strength')

      // Check descriptions contain pedagogical content
      const runSession = sessions.find(s => s.type === 'run')!
      expect(runSession.description).toContain('Objectif')
      expect(runSession.description).toContain('Echauffement')
      expect(runSession.description).toContain('Seance')
      expect(runSession.description).toContain('Conseil')

      // Check phase labels
      expect(runSession.description).toMatch(/\[(Base|Construction|Pic|Affutage)\]/)
    })

    it('should generate sessions for an intermediate triathlon plan', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: 'olympic', durationWeeks: 8, level: 'intermediate' })

      const count = await generateSessionsForPlan(plan.id, 'olympic', 8, new Date('2026-03-02'), 'intermediate')

      expect(count).toBeGreaterThan(0)

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
      })

      // Intermediate triathlon should have swim, bike, run sessions
      const types = [...new Set(sessions.map(s => s.type))]
      expect(types).toContain('swim')
      expect(types).toContain('bike')
      expect(types).toContain('run')
    })

    it('should generate sessions for an advanced running plan', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: 'marathon', durationWeeks: 4, level: 'advanced' })

      const count = await generateSessionsForPlan(plan.id, 'marathon', 4, new Date('2026-03-02'), 'advanced')

      // Advanced running has 7 sessions per week
      expect(count).toBe(7 * 4)

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
        orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
      })

      // Check that descriptions don't include beginner tips for advanced level
      const runSessions = sessions.filter(s => s.type === 'run')
      for (const s of runSessions) {
        expect(s.description).not.toContain('Conseil :')
      }
    })

    it('should generate sessions for swimming discipline', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: 'natation', durationWeeks: 4, level: 'beginner' })

      const count = await generateSessionsForPlan(plan.id, 'natation', 4, new Date('2026-03-02'), 'beginner')

      expect(count).toBeGreaterThan(0)

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
      })

      // All sessions should be swim type
      const types = [...new Set(sessions.map(s => s.type))]
      expect(types).toEqual(['swim'])
    })

    it('should generate sessions for cycling discipline', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: 'velo', durationWeeks: 4, level: 'intermediate' })

      const count = await generateSessionsForPlan(plan.id, 'velo', 4, new Date('2026-03-02'), 'intermediate')

      expect(count).toBeGreaterThan(0)

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
      })

      const types = [...new Set(sessions.map(s => s.type))]
      expect(types).toContain('bike')
    })

    it('should apply periodization phases', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: '10k', durationWeeks: 12, level: 'intermediate' })

      await generateSessionsForPlan(plan.id, '10k', 12, new Date('2026-03-02'), 'intermediate')

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
        orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
      })

      // First weeks should be Base phase
      const week1Sessions = sessions.filter(s => s.weekNumber === 1)
      expect(week1Sessions[0].description).toContain('[Base]')

      // Last week should be Affutage (taper)
      const lastWeekSessions = sessions.filter(s => s.weekNumber === 12)
      expect(lastWeekSessions[0].description).toContain('[Affutage]')
    })

    it('should adjust volume with multipliers', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: '10k', durationWeeks: 10, level: 'beginner' })

      await generateSessionsForPlan(plan.id, '10k', 10, new Date('2026-03-02'), 'beginner')

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
        orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
      })

      // Taper sessions should have lower duration than build sessions
      const taperSessions = sessions.filter(s => s.description?.includes('[Affutage]') && s.type === 'run')
      const buildSessions = sessions.filter(s => s.description?.includes('[Construction]') && s.type === 'run')

      if (taperSessions.length > 0 && buildSessions.length > 0) {
        const avgTaper = taperSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / taperSessions.length
        const avgBuild = buildSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / buildSessions.length
        expect(avgTaper).toBeLessThan(avgBuild)
      }
    })

    it('should reduce intensity during taper phase', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: 'marathon', durationWeeks: 12, level: 'advanced' })

      await generateSessionsForPlan(plan.id, 'marathon', 12, new Date('2026-03-02'), 'advanced')

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
      })

      // Taper phase sessions should not have 'hard' or 'interval' intensity
      const taperSessions = sessions.filter(s => s.description?.includes('[Affutage]'))
      for (const s of taperSessions) {
        expect(s.intensity).not.toBe('hard')
        expect(s.intensity).not.toBe('interval')
      }
    })

    it('should set correct dates for sessions', async () => {
      const user = await createTestUser()
      const startDate = new Date('2026-03-02') // Monday
      const plan = await createPlan(user.id, { targetType: '5k', durationWeeks: 2, level: 'beginner' })

      await generateSessionsForPlan(plan.id, '5k', 2, startDate, 'beginner')

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
        orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
      })

      // All sessions should have dates
      for (const s of sessions) {
        expect(s.date).not.toBeNull()
      }

      // Week 1 sessions should be within the first week
      const week1 = sessions.filter(s => s.weekNumber === 1)
      for (const s of week1) {
        const sessionDate = new Date(s.date!)
        expect(sessionDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime())
      }
    })

    it('should delete existing sessions before regenerating', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: '5k', durationWeeks: 4, level: 'beginner' })

      // Generate once
      const count1 = await generateSessionsForPlan(plan.id, '5k', 4, new Date('2026-03-02'), 'beginner')

      // Generate again
      const count2 = await generateSessionsForPlan(plan.id, '5k', 4, new Date('2026-03-02'), 'beginner')

      // Should have same count (not doubled)
      expect(count1).toBe(count2)

      const total = await prisma.trainingSession.count({ where: { planId: plan.id } })
      expect(total).toBe(count2)
    })

    it('should default to intermediate when no level specified', async () => {
      const user = await createTestUser()
      const plan = await createPlan(user.id, { targetType: '10k', durationWeeks: 4 })

      const count = await generateSessionsForPlan(plan.id, '10k', 4, new Date('2026-03-02'))

      // Intermediate running has 5 sessions per week
      expect(count).toBe(5 * 4)
    })
  })

  describe('regenerateSessions', () => {
    it('should regenerate sessions from plan data', async () => {
      const user = await createTestUser()
      const plan = await prisma.trainingPlan.create({
        data: {
          userId: user.id,
          name: 'Regen Plan',
          targetType: 'sprint',
          durationWeeks: 4,
          level: 'beginner',
          startDate: new Date('2026-03-02'),
        },
      })

      const count = await regenerateSessions(plan.id)
      expect(count).toBeGreaterThan(0)

      const sessions = await prisma.trainingSession.findMany({
        where: { planId: plan.id },
      })
      expect(sessions.length).toBe(count)
    })

    it('should throw if plan not found', async () => {
      await expect(regenerateSessions(99999)).rejects.toThrow('Plan not found')
    })

    it('should throw if plan has no start date', async () => {
      const user = await createTestUser()
      const plan = await prisma.trainingPlan.create({
        data: {
          userId: user.id,
          name: 'No Start Date',
          targetType: 'sprint',
          durationWeeks: 4,
        },
      })

      await expect(regenerateSessions(plan.id)).rejects.toThrow('missing start date')
    })
  })
})
