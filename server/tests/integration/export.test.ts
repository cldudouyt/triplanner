import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import { createTestUser, createTestCompetition, createTestPlan, authHeader } from '../helpers.js'
import { prisma } from '../setup.js'

describe('Export API', () => {
  describe('GET /api/v1/export/json', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/export/json')
      expect(res.status).toBe(401)
    })

    it('should export user data as JSON', async () => {
      const user = await createTestUser()
      const comp = await createTestCompetition(user.id, { name: 'Export Comp' })
      const plan = await createTestPlan(user.id, { name: 'Export Plan' })

      // Add a session to the plan
      await prisma.trainingSession.create({
        data: {
          planId: plan.id,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
          title: 'Test Run',
          duration: 30,
          intensity: 'easy',
        },
      })

      const res = await request(app)
        .get('/api/v1/export/json')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('application/json')
      expect(res.headers['content-disposition']).toContain('attachment')

      const data = res.body
      expect(data.version).toBe('1.0')
      expect(data.exportDate).toBeDefined()
      expect(data.user.email).toBe('testuser@example.com')
      expect(data.competitions).toHaveLength(1)
      expect(data.competitions[0].name).toBe('Export Comp')
      expect(data.trainingPlans).toHaveLength(1)
      expect(data.trainingPlans[0].name).toBe('Export Plan')
      expect(data.trainingPlans[0].sessions).toHaveLength(1)
      expect(data.trainingPlans[0].sessions[0].title).toBe('Test Run')
    })

    it('should export level and weeklyHours in plans', async () => {
      const user = await createTestUser()
      await prisma.trainingPlan.create({
        data: {
          userId: user.id,
          name: 'Leveled Plan',
          targetType: 'sprint',
          durationWeeks: 8,
          level: 'advanced',
          weeklyHours: 12,
        },
      })

      const res = await request(app)
        .get('/api/v1/export/json')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.trainingPlans[0].level).toBe('advanced')
      expect(res.body.trainingPlans[0].weeklyHours).toBe(12)
    })

    it('should not export template plans', async () => {
      const user = await createTestUser()
      await createTestPlan(user.id, { name: 'My Plan', isTemplate: false })
      await createTestPlan(user.id, { name: 'Template', isTemplate: true })

      const res = await request(app)
        .get('/api/v1/export/json')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.trainingPlans).toHaveLength(1)
      expect(res.body.trainingPlans[0].name).toBe('My Plan')
    })

    it('should export competitions with equipment items', async () => {
      const user = await createTestUser()
      const comp = await createTestCompetition(user.id)

      await prisma.equipmentItem.createMany({
        data: [
          { competitionId: comp.id, name: 'Combinaison', checked: true, category: 'natation' },
          { competitionId: comp.id, name: 'Casque', checked: false, category: 'velo' },
        ],
      })

      const res = await request(app)
        .get('/api/v1/export/json')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.competitions[0].equipmentItems).toHaveLength(2)
      expect(res.body.competitions[0].equipmentItems[0].name).toBe('Combinaison')
      expect(res.body.competitions[0].equipmentItems[0].checked).toBe(true)
    })

    it('should return empty arrays for user with no data', async () => {
      const user = await createTestUser()

      const res = await request(app)
        .get('/api/v1/export/json')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.competitions).toEqual([])
      expect(res.body.trainingPlans).toEqual([])
    })

    it('should not export other users data', async () => {
      const user1 = await createTestUser('user1@test.com')
      const user2 = await createTestUser('user2@test.com')

      await createTestCompetition(user1.id, { name: 'User1 Comp' })
      await createTestCompetition(user2.id, { name: 'User2 Comp' })

      const res = await request(app)
        .get('/api/v1/export/json')
        .set(authHeader(user1.accessToken))

      expect(res.body.competitions).toHaveLength(1)
      expect(res.body.competitions[0].name).toBe('User1 Comp')
    })
  })

  describe('GET /api/v1/export/csv', () => {
    it('should export data as CSV', async () => {
      const user = await createTestUser()
      await createTestCompetition(user.id, { name: 'CSV Comp' })

      const res = await request(app)
        .get('/api/v1/export/csv')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('text/csv')
      expect(res.headers['content-disposition']).toContain('attachment')
      expect(res.text).toContain('CSV Comp')
      expect(res.text).toContain('# COMPETITIONS')
    })
  })

  describe('POST /api/v1/export/import', () => {
    it('should import competitions', async () => {
      const user = await createTestUser()

      const importData = {
        competitions: [{
          name: 'Imported Comp',
          date: '2026-06-15T00:00:00.000Z',
          type: 'triathlon',
          subType: 'sprint',
          priority: 'A',
          status: 'planned',
        }],
      }

      const res = await request(app)
        .post('/api/v1/export/import')
        .set(authHeader(user.accessToken))
        .send(importData)

      expect(res.status).toBe(200)
      expect(res.body.results.competitions.created).toBe(1)
      expect(res.body.results.competitions.errors).toEqual([])

      // Verify in DB
      const comps = await prisma.competition.findMany({ where: { userId: user.id } })
      expect(comps).toHaveLength(1)
      expect(comps[0].name).toBe('Imported Comp')
    })

    it('should import training plans with sessions', async () => {
      const user = await createTestUser()

      const importData = {
        trainingPlans: [{
          name: 'Imported Plan',
          targetType: 'sprint',
          durationWeeks: 4,
          level: 'beginner',
          weeklyHours: 6,
          sessions: [
            {
              weekNumber: 1,
              dayOfWeek: 1,
              type: 'run',
              title: 'Session 1',
              duration: 30,
              intensity: 'easy',
            },
            {
              weekNumber: 1,
              dayOfWeek: 3,
              type: 'swim',
              title: 'Session 2',
              duration: 45,
              intensity: 'moderate',
            },
          ],
        }],
      }

      const res = await request(app)
        .post('/api/v1/export/import')
        .set(authHeader(user.accessToken))
        .send(importData)

      expect(res.status).toBe(200)
      expect(res.body.results.trainingPlans.created).toBe(1)
      expect(res.body.results.sessions.created).toBe(2)

      // Verify level/weeklyHours were imported
      const plans = await prisma.trainingPlan.findMany({ where: { userId: user.id } })
      expect(plans[0].level).toBe('beginner')
      expect(plans[0].weeklyHours).toBe(6)
    })

    it('should import competitions with equipment items', async () => {
      const user = await createTestUser()

      const importData = {
        competitions: [{
          name: 'Comp With Equipment',
          date: '2026-06-15T00:00:00.000Z',
          type: 'triathlon',
          subType: 'sprint',
          equipmentItems: [
            { name: 'Wetsuit', checked: true, category: 'swim' },
            { name: 'Helmet', checked: false, category: 'bike' },
          ],
        }],
      }

      const res = await request(app)
        .post('/api/v1/export/import')
        .set(authHeader(user.accessToken))
        .send(importData)

      expect(res.status).toBe(200)

      const comp = await prisma.competition.findFirst({
        where: { userId: user.id },
        include: { equipmentItems: true },
      })
      expect(comp!.equipmentItems).toHaveLength(2)
    })

    it('should return 400 for invalid data', async () => {
      const user = await createTestUser()

      const res = await request(app)
        .post('/api/v1/export/import')
        .set(authHeader(user.accessToken))
        .send('invalid')

      expect(res.status).toBe(400)
    })

    it('should handle empty import data gracefully', async () => {
      const user = await createTestUser()

      const res = await request(app)
        .post('/api/v1/export/import')
        .set(authHeader(user.accessToken))
        .send({})

      expect(res.status).toBe(200)
      expect(res.body.results.competitions.created).toBe(0)
      expect(res.body.results.trainingPlans.created).toBe(0)
    })
  })
})
