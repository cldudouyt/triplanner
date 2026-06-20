import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import { prisma } from '../setup.js'
import { createTestUser, createTestCompetition, createTestPlan, authHeader, type TestUser } from '../helpers.js'

describe('Training Plans API', () => {
  let user: TestUser

  beforeEach(async () => {
    user = await createTestUser()
  })

  describe('GET /api/v1/training-plans', () => {
    it('should return empty list initially', async () => {
      const res = await request(app)
        .get('/api/v1/training-plans')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
      expect(res.body.total).toBe(0)
    })

    it('should return user plans with competitions', async () => {
      const competition = await createTestCompetition(user.id)
      const plan = await createTestPlan(user.id, { name: 'Mon Plan' })

      await prisma.planCompetition.create({
        data: {
          planId: plan.id,
          competitionId: competition.id,
          isPrimary: true,
          order: 0,
        },
      })

      const res = await request(app)
        .get('/api/v1/training-plans')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe('Mon Plan')
      expect(res.body.data[0].competitions).toHaveLength(1)
      expect(res.body.data[0].competitions[0].isPrimary).toBe(true)
      expect(res.body.data[0].competitions[0].competition.name).toBe('Test Competition')
    })

    it('should not return other users plans', async () => {
      const otherUser = await createTestUser('other@example.com')
      await createTestPlan(otherUser.id, { name: 'Other Plan' })

      const res = await request(app)
        .get('/api/v1/training-plans')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
    })

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .get('/api/v1/training-plans')

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/v1/training-plans', () => {
    it('should create a plan without competitions', async () => {
      const res = await request(app)
        .post('/api/v1/training-plans')
        .set(authHeader(user.accessToken))
        .send({
          name: 'Nouveau Plan',
          targetType: 'marathon',
          durationWeeks: 16,
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Nouveau Plan')
      expect(res.body.targetType).toBe('marathon')
      expect(res.body.durationWeeks).toBe(16)
      expect(res.body.competitions).toEqual([])
    })

    it('should create a plan with multiple competitions', async () => {
      const comp1 = await createTestCompetition(user.id, { name: 'Triathlon Sprint', priority: 'B' })
      const comp2 = await createTestCompetition(user.id, { name: 'Ironman', priority: 'A' })

      const res = await request(app)
        .post('/api/v1/training-plans')
        .set(authHeader(user.accessToken))
        .send({
          name: 'Plan Multi-Objectifs',
          targetType: 'ironman',
          durationWeeks: 24,
          competitionIds: [
            { id: comp2.id, isPrimary: true },
            { id: comp1.id, isPrimary: false },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.competitions).toHaveLength(2)

      const primaryComp = res.body.competitions.find((c: any) => c.isPrimary)
      expect(primaryComp.competition.name).toBe('Ironman')

      const secondaryComp = res.body.competitions.find((c: any) => !c.isPrimary)
      expect(secondaryComp.competition.name).toBe('Triathlon Sprint')
    })

    it('should auto-set first competition as primary', async () => {
      const comp = await createTestCompetition(user.id)

      const res = await request(app)
        .post('/api/v1/training-plans')
        .set(authHeader(user.accessToken))
        .send({
          name: 'Plan',
          targetType: 'sprint',
          durationWeeks: 8,
          competitionIds: [{ id: comp.id }],
        })

      expect(res.status).toBe(201)
      expect(res.body.competitions[0].isPrimary).toBe(true)
    })

    it('should calculate endDate from startDate and duration', async () => {
      const res = await request(app)
        .post('/api/v1/training-plans')
        .set(authHeader(user.accessToken))
        .send({
          name: 'Plan avec dates',
          targetType: 'sprint',
          durationWeeks: 4,
          startDate: '2026-01-01',
        })

      expect(res.status).toBe(201)
      expect(res.body.startDate).toBeDefined()
      expect(res.body.endDate).toBeDefined()
    })

    it('should reject invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/training-plans')
        .set(authHeader(user.accessToken))
        .send({
          name: '',
          targetType: 'sprint',
          durationWeeks: 0,
        })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/training-plans/:id', () => {
    it('should return plan with sessions and competitions', async () => {
      const competition = await createTestCompetition(user.id)
      const plan = await createTestPlan(user.id)

      await prisma.planCompetition.create({
        data: { planId: plan.id, competitionId: competition.id, isPrimary: true, order: 0 },
      })

      await prisma.trainingSession.create({
        data: {
          planId: plan.id,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
          title: 'Footing',
        },
      })

      const res = await request(app)
        .get(`/api/v1/training-plans/${plan.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.sessions).toHaveLength(1)
      expect(res.body.competitions).toHaveLength(1)
    })

    it('should return 404 for non-existent plan', async () => {
      const res = await request(app)
        .get('/api/v1/training-plans/99999')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(404)
    })

    it('should not return other users plan', async () => {
      const otherUser = await createTestUser('other@example.com')
      const plan = await createTestPlan(otherUser.id)

      const res = await request(app)
        .get(`/api/v1/training-plans/${plan.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/v1/training-plans/:id', () => {
    it('should update plan name', async () => {
      const plan = await createTestPlan(user.id, { name: 'Old Name' })

      const res = await request(app)
        .put(`/api/v1/training-plans/${plan.id}`)
        .set(authHeader(user.accessToken))
        .send({ name: 'New Name' })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('New Name')
    })

    it('should update competitions', async () => {
      const comp1 = await createTestCompetition(user.id, { name: 'Comp 1' })
      const comp2 = await createTestCompetition(user.id, { name: 'Comp 2' })
      const plan = await createTestPlan(user.id)

      await prisma.planCompetition.create({
        data: { planId: plan.id, competitionId: comp1.id, isPrimary: true, order: 0 },
      })

      const res = await request(app)
        .put(`/api/v1/training-plans/${plan.id}`)
        .set(authHeader(user.accessToken))
        .send({
          competitionIds: [{ id: comp2.id, isPrimary: true }],
        })

      expect(res.status).toBe(200)
      expect(res.body.competitions).toHaveLength(1)
      expect(res.body.competitions[0].competition.name).toBe('Comp 2')
    })

    it('should return 404 for non-existent plan', async () => {
      const res = await request(app)
        .put('/api/v1/training-plans/99999')
        .set(authHeader(user.accessToken))
        .send({ name: 'Test' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/training-plans/:id', () => {
    it('should delete plan and cascade to sessions and competitions', async () => {
      const competition = await createTestCompetition(user.id)
      const plan = await createTestPlan(user.id)

      await prisma.planCompetition.create({
        data: { planId: plan.id, competitionId: competition.id, isPrimary: true, order: 0 },
      })

      await prisma.trainingSession.create({
        data: { planId: plan.id, weekNumber: 1, dayOfWeek: 1, type: 'run' },
      })

      const res = await request(app)
        .delete(`/api/v1/training-plans/${plan.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(204)

      // Verify cascade deletion
      const sessions = await prisma.trainingSession.findMany({ where: { planId: plan.id } })
      const planComps = await prisma.planCompetition.findMany({ where: { planId: plan.id } })
      expect(sessions).toHaveLength(0)
      expect(planComps).toHaveLength(0)

      // Competition should still exist
      const comp = await prisma.competition.findUnique({ where: { id: competition.id } })
      expect(comp).not.toBeNull()
    })
  })

  describe('GET /api/v1/training-plans/templates', () => {
    it('should return templates', async () => {
      await createTestPlan(user.id, { name: 'Template Sprint', isTemplate: true })
      await createTestPlan(user.id, { name: 'My Plan', isTemplate: false })

      const res = await request(app)
        .get('/api/v1/training-plans/templates')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].name).toBe('Template Sprint')
    })
  })
})
