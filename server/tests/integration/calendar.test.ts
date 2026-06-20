import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import { createTestUser, createTestCompetition, createTestPlan, authHeader } from '../helpers.js'
import { prisma } from '../setup.js'

describe('Calendar API', () => {
  describe('GET /api/v1/calendar/events', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2026-01-01', end: '2026-12-31' })

      expect(res.status).toBe(401)
    })

    it('should return 400 without date parameters', async () => {
      const user = await createTestUser()

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('start and end')
    })

    it('should return empty array when no events', async () => {
      const user = await createTestUser()

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2026-01-01', end: '2026-12-31' })
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it('should return competitions as events', async () => {
      const user = await createTestUser()
      await createTestCompetition(user.id, {
        name: 'Triathlon de Paris',
        date: new Date('2026-06-15'),
        priority: 'A',
      })

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2026-01-01', end: '2026-12-31' })
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)

      const event = res.body[0]
      expect(event.title).toBe('Triathlon de Paris')
      expect(event.id).toMatch(/^comp-/)
      expect(event.sourceType).toBe('competition')
      expect(event.priority).toBe('A')
      expect(event.color).toBeDefined()
    })

    it('should return training sessions as events', async () => {
      const user = await createTestUser()
      const plan = await createTestPlan(user.id, { name: 'Plan Test' })

      await prisma.trainingSession.create({
        data: {
          planId: plan.id,
          weekNumber: 1,
          dayOfWeek: 1,
          date: new Date('2026-06-10'),
          type: 'run',
          title: 'Footing',
          duration: 30,
          intensity: 'easy',
        },
      })

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2026-06-01', end: '2026-06-30' })
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)

      const event = res.body[0]
      expect(event.title).toBe('Footing')
      expect(event.id).toMatch(/^session-/)
      expect(event.sourceType).toBe('training_session')
      expect(event.type).toBe('run')
      expect(event.planName).toBe('Plan Test')
    })

    it('should return both competitions and sessions', async () => {
      const user = await createTestUser()
      await createTestCompetition(user.id, {
        name: 'Competition',
        date: new Date('2026-06-15'),
      })

      const plan = await createTestPlan(user.id)
      await prisma.trainingSession.create({
        data: {
          planId: plan.id,
          weekNumber: 1,
          dayOfWeek: 1,
          date: new Date('2026-06-10'),
          type: 'swim',
          title: 'Natation',
          duration: 45,
          intensity: 'moderate',
        },
      })

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2026-06-01', end: '2026-06-30' })
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)

      const types = res.body.map((e: any) => e.sourceType)
      expect(types).toContain('competition')
      expect(types).toContain('training_session')
    })

    it('should filter events by date range', async () => {
      const user = await createTestUser()
      await createTestCompetition(user.id, {
        name: 'In Range',
        date: new Date('2026-06-15'),
      })
      await createTestCompetition(user.id, {
        name: 'Out of Range',
        date: new Date('2026-12-15'),
      })

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2026-06-01', end: '2026-06-30' })
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].title).toBe('In Range')
    })

    it('should not return other users events', async () => {
      const user1 = await createTestUser('cal1@test.com')
      const user2 = await createTestUser('cal2@test.com')

      await createTestCompetition(user1.id, {
        name: 'User1 Event',
        date: new Date('2026-06-15'),
      })
      await createTestCompetition(user2.id, {
        name: 'User2 Event',
        date: new Date('2026-06-15'),
      })

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2026-06-01', end: '2026-06-30' })
        .set(authHeader(user1.accessToken))

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].title).toBe('User1 Event')
    })

    it('should include session metadata in events', async () => {
      const user = await createTestUser()
      const plan = await createTestPlan(user.id)

      await prisma.trainingSession.create({
        data: {
          planId: plan.id,
          weekNumber: 1,
          dayOfWeek: 1,
          date: new Date('2026-06-10'),
          type: 'bike',
          title: 'Sortie velo',
          duration: 90,
          distance: 40,
          intensity: 'moderate',
          completed: true,
          description: 'Sortie longue en endurance',
          notes: 'Bonnes sensations',
        },
      })

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2026-06-01', end: '2026-06-30' })
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      const event = res.body[0]
      expect(event.duration).toBe(90)
      expect(event.distance).toBe(40)
      expect(event.completed).toBe(true)
      expect(event.description).toContain('endurance')
      expect(event.notes).toBe('Bonnes sensations')
    })
  })
})
