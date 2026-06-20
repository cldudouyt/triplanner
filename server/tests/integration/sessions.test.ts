import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import prisma from '../../src/config/database.js'
import { createTestUser, createTestPlan, authHeader, type TestUser } from '../helpers.js'

describe('Training Sessions API', () => {
  let user: TestUser
  let planId: number

  beforeEach(async () => {
    user = await createTestUser()
    const plan = await createTestPlan(user.id)
    planId = plan.id
  })

  describe('POST /api/v1/training-sessions', () => {
    it('should create a session', async () => {
      const res = await request(app)
        .post('/api/v1/training-sessions')
        .set(authHeader(user.accessToken))
        .send({
          planId,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
          title: 'Footing matinal',
          duration: 45,
          intensity: 'easy',
        })

      expect(res.status).toBe(201)
      expect(res.body.planId).toBe(planId)
      expect(res.body.type).toBe('run')
      expect(res.body.completed).toBe(false)
    })

    it('should create a swim session with distance', async () => {
      const res = await request(app)
        .post('/api/v1/training-sessions')
        .set(authHeader(user.accessToken))
        .send({
          planId,
          weekNumber: 2,
          dayOfWeek: 3,
          type: 'swim',
          title: 'Technique crawl',
          duration: 60,
          distance: 2500,
          intensity: 'moderate',
        })

      expect(res.status).toBe(201)
      expect(res.body.distance).toBe(2500)
    })

    it('should create a brick session', async () => {
      const res = await request(app)
        .post('/api/v1/training-sessions')
        .set(authHeader(user.accessToken))
        .send({
          planId,
          weekNumber: 3,
          dayOfWeek: 6,
          type: 'brick',
          title: 'Enchaînement vélo-course',
          description: '1h vélo + 30min course',
          duration: 90,
          intensity: 'hard',
        })

      expect(res.status).toBe(201)
      expect(res.body.type).toBe('brick')
    })

    it('should reject invalid plan', async () => {
      const res = await request(app)
        .post('/api/v1/training-sessions')
        .set(authHeader(user.accessToken))
        .send({
          planId: 99999,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
        })

      expect(res.status).toBe(404)
    })

    it('should reject other users plan', async () => {
      const otherUser = await createTestUser('other@example.com')
      const otherPlan = await createTestPlan(otherUser.id)

      const res = await request(app)
        .post('/api/v1/training-sessions')
        .set(authHeader(user.accessToken))
        .send({
          planId: otherPlan.id,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
        })

      expect(res.status).toBe(404)
    })

    it('should reject invalid type', async () => {
      const res = await request(app)
        .post('/api/v1/training-sessions')
        .set(authHeader(user.accessToken))
        .send({
          planId,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'yoga',
        })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/training-sessions/:id', () => {
    it('should return a session', async () => {
      const session = await prisma.trainingSession.create({
        data: {
          planId,
          weekNumber: 1,
          dayOfWeek: 2,
          type: 'bike',
          title: 'Sortie longue',
        },
      })

      const res = await request(app)
        .get(`/api/v1/training-sessions/${session.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Sortie longue')
    })

    it('should return 404 for non-existent session', async () => {
      const res = await request(app)
        .get('/api/v1/training-sessions/99999')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(404)
    })

    it('should not return other users session', async () => {
      const otherUser = await createTestUser('other@example.com')
      const otherPlan = await createTestPlan(otherUser.id)
      const session = await prisma.trainingSession.create({
        data: {
          planId: otherPlan.id,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
        },
      })

      const res = await request(app)
        .get(`/api/v1/training-sessions/${session.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/v1/training-sessions/:id', () => {
    it('should update session details', async () => {
      const session = await prisma.trainingSession.create({
        data: {
          planId,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
          title: 'Old Title',
        },
      })

      const res = await request(app)
        .put(`/api/v1/training-sessions/${session.id}`)
        .set(authHeader(user.accessToken))
        .send({
          title: 'New Title',
          duration: 60,
          intensity: 'hard',
        })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('New Title')
      expect(res.body.duration).toBe(60)
    })

    it('should mark session as completed', async () => {
      const session = await prisma.trainingSession.create({
        data: {
          planId,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
          duration: 45,
        },
      })

      const res = await request(app)
        .put(`/api/v1/training-sessions/${session.id}`)
        .set(authHeader(user.accessToken))
        .send({
          completed: true,
          actualDuration: 50,
          actualDistance: 8500,
          notes: 'Bonne séance, ressenti positif',
        })

      expect(res.status).toBe(200)
      expect(res.body.completed).toBe(true)
      expect(res.body.actualDuration).toBe(50)
      expect(res.body.notes).toBe('Bonne séance, ressenti positif')
    })

    it('should change session type', async () => {
      const session = await prisma.trainingSession.create({
        data: {
          planId,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
        },
      })

      const res = await request(app)
        .put(`/api/v1/training-sessions/${session.id}`)
        .set(authHeader(user.accessToken))
        .send({ type: 'rest' })

      expect(res.status).toBe(200)
      expect(res.body.type).toBe('rest')
    })

    it('should return 404 for non-existent session', async () => {
      const res = await request(app)
        .put('/api/v1/training-sessions/99999')
        .set(authHeader(user.accessToken))
        .send({ title: 'Test' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/training-sessions/:id', () => {
    it('should delete a session', async () => {
      const session = await prisma.trainingSession.create({
        data: {
          planId,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
        },
      })

      const res = await request(app)
        .delete(`/api/v1/training-sessions/${session.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(204)

      // Verify deletion
      const deleted = await prisma.trainingSession.findUnique({
        where: { id: session.id },
      })
      expect(deleted).toBeNull()
    })

    it('should return 404 for non-existent session', async () => {
      const res = await request(app)
        .delete('/api/v1/training-sessions/99999')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(404)
    })

    it('should not delete other users session', async () => {
      const otherUser = await createTestUser('other@example.com')
      const otherPlan = await createTestPlan(otherUser.id)
      const session = await prisma.trainingSession.create({
        data: {
          planId: otherPlan.id,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
        },
      })

      const res = await request(app)
        .delete(`/api/v1/training-sessions/${session.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(404)

      // Verify not deleted
      const notDeleted = await prisma.trainingSession.findUnique({
        where: { id: session.id },
      })
      expect(notDeleted).not.toBeNull()
    })
  })
})
